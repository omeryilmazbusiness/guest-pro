import { normalizeApiKey, normalizeAppPassword } from "./normalize-secret";
import { getResolvedResendFrom } from "./resend-domains";
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
  const resolved = getResolvedResendFrom();
  if (resolved) return resolved;
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
