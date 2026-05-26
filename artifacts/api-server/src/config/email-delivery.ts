import { normalizeAppPassword } from "./normalize-secret";
import { resolveSmtpConfig } from "./smtp-config";

export type EmailDeliveryMode = "resend" | "smtp" | "console";

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

export function getResendFrom(): string {
  return (
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "Guest Pro <onboarding@resend.dev>"
  );
}

/** Resend (HTTPS) preferred — Gmail SMTP often fails from cloud hosts. */
export function getEmailDeliveryMode(): EmailDeliveryMode {
  if (getResendApiKey()) return "resend";
  if (resolveSmtpConfig()) return "smtp";
  return "console";
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
