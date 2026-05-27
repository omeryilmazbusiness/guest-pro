import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../../config/env";
import { resolveSmtpConfig } from "../../config/smtp-config";
import { withAsyncTimeout } from "../async-timeout";
import { logger } from "../logger";
import type { IEmailSender, SendEmailInput } from "./email-sender";

const SMTP_SEND_TIMEOUT_MS = 25_000;

type TransportSpec = { label: string; create: () => Transporter };

function buildGmailTransports(user: string, pass: string): TransportSpec[] {
  return [
    {
      label: "gmail-service",
      create: () =>
        nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: SMTP_SEND_TIMEOUT_MS,
        }),
    },
    {
      label: "gmail-465",
      create: () =>
        nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user, pass },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: SMTP_SEND_TIMEOUT_MS,
        }),
    },
    {
      label: "gmail-587",
      create: () =>
        nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: { user, pass },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: SMTP_SEND_TIMEOUT_MS,
        }),
    },
  ];
}

function buildGenericTransports(smtp: NonNullable<ReturnType<typeof resolveSmtpConfig>>): TransportSpec[] {
  return [
    {
      label: `smtp-${smtp.host}-${smtp.port}`,
      create: () =>
        nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          auth: { user: smtp.user, pass: smtp.pass },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: SMTP_SEND_TIMEOUT_MS,
          ...(smtp.port === 587 && !smtp.secure ? { requireTLS: true } : {}),
        }),
    },
  ];
}

export class SmtpEmailSender implements IEmailSender {
  async send(input: SendEmailInput): Promise<void> {
    const smtp = resolveSmtpConfig();
    if (!smtp) {
      throw new Error("SMTP is not configured");
    }

    const isGmail = smtp.host.includes("gmail.com") || smtp.user.endsWith("@gmail.com");
    const specs = isGmail ? buildGmailTransports(smtp.user, smtp.pass) : buildGenericTransports(smtp);

    const mail = {
      from: smtp.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br>"),
    };

    const errors: string[] = [];

    for (const spec of specs) {
      const transport = spec.create();
      try {
        await withAsyncTimeout(
          `smtp ${spec.label}`,
          transport.sendMail(mail),
          SMTP_SEND_TIMEOUT_MS,
        );
        logger.info({ to: input.to, via: spec.label }, "email:sent");
        transport.close();
        return;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${spec.label}: ${errMsg.split("\n")[0]}`);
        logger.warn({ err, via: spec.label, to: input.to }, "email:transport-attempt-failed");
        transport.close();
      }
    }

    logger.error({ errors, smtpUser: smtp.user, passLength: smtp.pass.length }, "email:all-smtp-failed");

    const combined = errors.join("; ");
    if (/535|534|invalid login|badcredentials/i.test(combined)) {
      throw new Error(
        env.NODE_ENV === "production"
          ? "Gmail rejected the app password. On Railway set GMAIL_APP_PASSWORD to a new 16-character Google App Password (no quotes), or add RESEND_API_KEY."
          : "Gmail rejected the app password (535). Use a Google App Password, not your normal password.",
      );
    }
    if (/timed out|timeout|ETIMEDOUT|ECONNREFUSED/i.test(combined)) {
      throw new Error(
        "SMTP connection failed from the server (timeout/blocked). Add RESEND_API_KEY on Railway for reliable OTP email.",
      );
    }
    throw new Error(
      "Could not send verification email. Add RESEND_API_KEY on Railway or fix GMAIL_APP_PASSWORD (16 chars, no quotes).",
    );
  }
}
