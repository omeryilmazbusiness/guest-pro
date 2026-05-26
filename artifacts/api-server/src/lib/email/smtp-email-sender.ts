import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { resolveSmtpConfig } from "../../config/smtp-config";
import { withAsyncTimeout } from "../async-timeout";
import { logger } from "../logger";
import type { IEmailSender, SendEmailInput } from "./email-sender";

const SMTP_SEND_TIMEOUT_MS = 25_000;

export class SmtpEmailSender implements IEmailSender {
  private transporter: Transporter | null = null;
  private transporterKey: string | null = null;

  private getTransporter(): Transporter {
    const smtp = resolveSmtpConfig();
    if (!smtp) {
      throw new Error("SMTP is not configured");
    }
    const key = `${smtp.host}:${smtp.port}:${smtp.user}`;
    if (!this.transporter || this.transporterKey !== key) {
      this.transporterKey = key;
      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: SMTP_SEND_TIMEOUT_MS,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
        ...(smtp.port === 587 && !smtp.secure ? { requireTLS: true } : {}),
      });
    }
    return this.transporter;
  }

  async send(input: SendEmailInput): Promise<void> {
    const smtp = resolveSmtpConfig();
    if (!smtp) {
      throw new Error("SMTP is not configured");
    }

    const transport = this.getTransporter();
    try {
      await withAsyncTimeout(
        "smtp sendMail",
        transport.sendMail({
          from: smtp.from,
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html ?? input.text.replace(/\n/g, "<br>"),
        }),
        SMTP_SEND_TIMEOUT_MS,
      );
      logger.info({ to: input.to, subject: input.subject }, "email:sent");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: input.to, smtpUser: smtp.user }, "email:send-failed");
      let message = "Could not send verification email. Check SMTP / Gmail App Password settings.";
      if (/timed out/i.test(errMsg)) {
        message = "Verification email timed out. Try again or check SMTP host/port on the server.";
      } else if (/invalid login|authentication|535|534|badcredentials/i.test(errMsg)) {
        message =
          "Gmail rejected the app password (535). In Railway Variables set GMAIL_APP_PASSWORD to the 16-character Google App Password with no quotes or spaces.";
      }
      throw new Error(message);
    }
  }
}
