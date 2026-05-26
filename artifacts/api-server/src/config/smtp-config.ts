import { env } from "./env";
import { normalizeAppPassword } from "./normalize-secret";

export interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export { normalizeAppPassword };

/** Gmail shortcut: set GMAIL_USER + GMAIL_APP_PASSWORD (or SMTP_* explicitly). */
export function resolveSmtpConfig(): ResolvedSmtpConfig | null {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);

  if (gmailUser && gmailPass) {
    return {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      user: gmailUser,
      pass: gmailPass,
      from: env.SMTP_FROM ?? `Guest Pro Platform <${gmailUser}>`,
    };
  }

  const smtpPass = normalizeAppPassword(process.env.SMTP_PASS) ?? process.env.SMTP_PASS?.trim();
  if (!env.SMTP_HOST || !env.SMTP_USER || !smtpPass) {
    return null;
  }

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: smtpPass,
    from: env.SMTP_FROM ?? `Guest Pro Platform <${env.SMTP_USER}>`,
  };
}

