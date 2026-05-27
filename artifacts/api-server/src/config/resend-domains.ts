import { logger } from "../lib/logger";
import { normalizeApiKey } from "./normalize-secret";

function getResendApiKey(): string | undefined {
  return normalizeApiKey(process.env.RESEND_API_KEY);
}

export type ResendDomainRow = {
  id: string;
  name: string;
  status: string;
  capabilities?: { sending?: string; receiving?: string };
};

/** Resend may report verified in UI while API status is partially_verified. */
export function isResendDomainSendReady(d: ResendDomainRow): boolean {
  const statusOk =
    d.status === "verified" ||
    d.status === "partially_verified" ||
    d.status === "partially_failed";
  const sending = d.capabilities?.sending ?? "enabled";
  return statusOk && sending === "enabled";
}

export function formatResendFromAddress(domainName: string, displayName = "Guest Pro"): string {
  return `${displayName} <noreply@${domainName}>`;
}

/** Prefer the domain Resend actually verified (apex vs www). */
export function pickGuestProSendDomain(domains: ResendDomainRow[]): ResendDomainRow | undefined {
  const ready = domains.filter(isResendDomainSendReady);
  if (!ready.length) return undefined;

  const score = (name: string): number => {
    const n = name.toLowerCase();
    if (n === "guest-pro.com") return 4;
    if (n === "www.guest-pro.com") return 3;
    if (n.endsWith(".guest-pro.com")) return 2;
    if (n.includes("guest-pro")) return 1;
    return 0;
  };

  return [...ready].sort((a, b) => score(b.name) - score(a.name))[0];
}

export async function fetchResendDomains(apiKey: string): Promise<ResendDomainRow[]> {
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "[FATAL] RESEND_API_KEY rejected by Resend. Create a new key at resend.com/api-keys.",
    );
  }

  if (!res.ok) {
    logger.warn({ status: res.status }, "resend:domains-list-failed");
    return [];
  }

  const body = (await res.json()) as { data?: ResendDomainRow[] };
  return body.data ?? [];
}

let resolvedProductionFrom: string | null = null;

export function getResolvedResendFrom(): string | null {
  return resolvedProductionFrom;
}

export function setResolvedResendFrom(from: string): void {
  resolvedProductionFrom = from;
}

/** Query Resend and cache the From address that matches a verified sending domain. */
export async function resolveResendFromForProduction(): Promise<string | null> {
  const key = getResendApiKey();
  if (!key) return null;

  const explicit = process.env.RESEND_FROM?.trim();
  if (explicit) {
    logger.info({ from: explicit }, "resend:using-explicit-from");
    return explicit;
  }

  const domains = await fetchResendDomains(key);
  const picked = pickGuestProSendDomain(domains);

  logger.info(
    {
      domains: domains.map((d) => ({
        name: d.name,
        status: d.status,
        sending: d.capabilities?.sending,
      })),
      picked: picked?.name,
    },
    "resend:domains-listed",
  );

  if (!picked) {
    const pending = domains.filter((d) => d.status === "pending" || d.status === "not_started");
    if (pending.length) {
      logger.warn(
        { pending: pending.map((d) => d.name) },
        "resend:domain-pending — DNS may still be propagating; retry in a few minutes",
      );
    }
    return null;
  }

  const from = formatResendFromAddress(picked.name);
  setResolvedResendFrom(from);
  return from;
}

export async function verifyResendForProduction(verificationEmail: string): Promise<void> {
  const key = getResendApiKey();
  if (!key) return;

  if (!key.startsWith("re_")) {
    throw new Error("[FATAL] RESEND_API_KEY must start with re_ (no quotes in Railway).");
  }

  const from = await resolveResendFromForProduction();
  if (!from) {
    logger.warn(
      {
        verificationEmail,
        fallbackFrom: "Guest Pro <noreply@www.guest-pro.com>",
        hint:
          "No send-ready domain in Resend API yet. If the dashboard shows verified, wait 2–5 min and redeploy. " +
          "Ensure the domain name in Resend matches the From address (guest-pro.com vs www.guest-pro.com).",
      },
      "resend:no-send-ready-domain",
    );
    return;
  }

  if (from.includes("onboarding@resend.dev")) {
    throw new Error("[FATAL] Remove RESEND_FROM=onboarding@resend.dev in production.");
  }

  logger.info({ from, verificationEmail }, "resend:production-from-ready");
}
