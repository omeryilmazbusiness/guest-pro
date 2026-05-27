import { logger } from "../lib/logger";
import { normalizeApiKey, normalizeAppPassword } from "./normalize-secret";
import { resolveSmtpConfig } from "./smtp-config";

export type EmailDeliveryMode = "resend" | "smtp" | "console";

/** Verified on Resend — must match the domain you added (www.guest-pro.com). */
export const PRODUCTION_RESEND_FROM = "Guest Pro <noreply@www.guest-pro.com>";

export function getResendApiKey(): string | undefined {
  return normalizeApiKey(process.env.RESEND_API_KEY);
}

/** Match verified Resend domain to the domain in the From address (www vs apex). */
export function resendFromDomainMatchesVerified(fromDomain: string, verifiedName: string): boolean {
  if (fromDomain === verifiedName) return true;
  const base = (d: string) => d.replace(/^www\./i, "").toLowerCase();
  return base(fromDomain) === base(verifiedName);
}

export function getResendFrom(): string {
  const explicit = process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim();
  if (explicit) return explicit;
  if (getResendApiKey() && process.env.NODE_ENV === "production") {
    return PRODUCTION_RESEND_FROM;
  }
  return "Guest Pro <onboarding@resend.dev>";
}

/** Resend (HTTPS) preferred — Gmail SMTP often fails from cloud hosts. */
export function getEmailDeliveryMode(): EmailDeliveryMode {
  if (getResendApiKey()) return "resend";
  if (resolveSmtpConfig()) return "smtp";
  return "console";
}

/** Boot-time SMTP check — fails deploy if Gmail cannot connect from Railway. */
export async function verifyProductionEmailDelivery(): Promise<void> {
  const mode = getEmailDeliveryMode();
  if (mode === "resend") {
    return;
  }
  if (mode !== "smtp") return;

  const smtp = resolveSmtpConfig();
  if (!smtp) return;

  const nodemailer = await import("nodemailer");
  const specs =
    smtp.host.includes("gmail.com") || smtp.user.endsWith("@gmail.com")
      ? [
          { label: "gmail-service", opts: { service: "gmail" as const, auth: { user: smtp.user, pass: smtp.pass } } },
          { label: "gmail-465", opts: { host: "smtp.gmail.com", port: 465, secure: true, auth: { user: smtp.user, pass: smtp.pass } } },
        ]
      : [{ label: "custom", opts: { host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.pass } } }];

  const errors: string[] = [];
  for (const spec of specs) {
    const t = nodemailer.createTransport({ ...spec.opts, connectionTimeout: 8_000 });
    try {
      await t.verify();
      await t.close();
      return;
    } catch (e) {
      errors.push(`${spec.label}: ${e instanceof Error ? e.message : String(e)}`);
      t.close();
    }
  }
  throw new Error(
    `[FATAL] SMTP verify failed on boot: ${errors.join("; ")}. ` +
      "Fix GMAIL_APP_PASSWORD (16 chars, no quotes) or set RESEND_API_KEY on Railway.",
  );
}

/** Validates Resend key and warns when test-mode `from` cannot reach OTP recipient. */
export async function verifyResendForProduction(verificationEmail: string): Promise<void> {
  const key = getResendApiKey();
  if (!key) return;

  if (!key.startsWith("re_")) {
    throw new Error(
      "[FATAL] RESEND_API_KEY must start with re_. Check Railway Variables (no quotes).",
    );
  }

  const from = getResendFrom();
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "[FATAL] RESEND_API_KEY rejected by Resend (invalid or revoked). Create a new key at resend.com/api-keys.",
    );
  }

  if (!res.ok) {
    logger.warn({ status: res.status }, "resend:domains-check-skipped");
    return;
  }

  const body = (await res.json()) as {
    data?: Array<{ name: string; status: string }>;
  };
  const verified = (body.data ?? []).filter((d) => d.status === "verified");
  const usesTestFrom = /@resend\.dev>/i.test(from) || from.includes("onboarding@resend.dev");

  if (verified.length > 0) {
    const fromDomain = from.match(/@([\w.-]+)/)?.[1];
    const domainOk =
      fromDomain && verified.some((d) => resendFromDomainMatchesVerified(fromDomain, d.name));
    if (fromDomain && !domainOk && !usesTestFrom) {
      const suggested = verified.find((d) => d.name.includes("guest-pro"))?.name ?? verified[0]?.name;
      throw new Error(
        `[FATAL] RESEND_FROM domain "${fromDomain}" is not verified. ` +
          `Set RESEND_FROM=Guest Pro <noreply@${suggested ?? "www.guest-pro.com"}> on Railway.`,
      );
    }
    if (usesTestFrom) {
      throw new Error(
        `[FATAL] Do not use onboarding@resend.dev in production. ` +
          `Set RESEND_FROM=${PRODUCTION_RESEND_FROM} or remove RESEND_FROM to use the default.`,
      );
    }
    logger.info({ from, verifiedDomains: verified.map((d) => d.name) }, "resend:domain-verified");
    return;
  }

  if (usesTestFrom) {
    logger.warn(
      {
        verificationEmail,
        from,
        hint:
          "With onboarding@resend.dev, Resend only delivers to the email you used to sign up. " +
          "Use that address as platform verification email, or verify guest-pro.com and set RESEND_FROM.",
      },
      "resend:test-mode-active",
    );
    return;
  }

  logger.warn(
    {
      verificationEmail,
      from,
      hint: "Complete DNS verification on resend.com/domains for www.guest-pro.com (status must be verified).",
    },
    "resend:no-verified-domain-yet",
  );
}

export function validateEmailDeliveryForProduction(): void {
  if (getResendApiKey()) {
    return;
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);
  if (gmailUser && gmailPass) {
    if (gmailPass.length !== 16) {
      throw new Error(
        `[FATAL] GMAIL_APP_PASSWORD must be exactly 16 characters (got ${gmailPass.length}). ` +
          "Or set RESEND_API_KEY for reliable delivery on Railway.",
      );
    }
    return;
  }

  if (resolveSmtpConfig()) {
    return;
  }

  throw new Error(
    "[FATAL] Platform OTP email not configured. Set RESEND_API_KEY (recommended) or GMAIL_USER + GMAIL_APP_PASSWORD.",
  );
}
