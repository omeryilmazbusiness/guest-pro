import { env } from "./env";

export type EmailDeliveryMode = "smtp" | "console";

export interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/** Gmail shortcut: set GMAIL_USER + GMAIL_APP_PASSWORD (or SMTP_* explicitly). */
export function resolveSmtpConfig(): ResolvedSmtpConfig | null {
  const gmailUser = process.env.GMAIL_USER?.trim();
  /** Gmail app passwords are 16 chars; spaces in .env are optional grouping. */
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "").trim();

  if (gmailUser && gmailPass) {
    return {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: gmailUser,
      pass: gmailPass,
      from:
        env.SMTP_FROM ??
        `Guest Pro Platform <${gmailUser}>`,
    };
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM ?? `Guest Pro Platform <${env.SMTP_USER}>`,
  };
}

export function getEmailDeliveryMode(): EmailDeliveryMode {
  return resolveSmtpConfig() ? "smtp" : "console";
}
