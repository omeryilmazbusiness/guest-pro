import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { resolveSmtpConfig } from "../../config/smtp-config";
import { logger } from "../logger";
import type { IEmailSender, SendEmailInput } from "./email-sender";

export class SmtpEmailSender implements IEmailSender {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const smtp = resolveSmtpConfig();
      if (!smtp) {
        throw new Error("SMTP is not configured");
      }
      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
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
      await transport.sendMail({
        from: smtp.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? input.text.replace(/\n/g, "<br>"),
      });
      logger.info({ to: input.to, subject: input.subject }, "email:sent");
    } catch (err) {
      logger.error({ err, to: input.to }, "email:send-failed");
      const message =
        err instanceof Error && /invalid login|authentication|535|534/i.test(err.message)
          ? "SMTP authentication failed. For Gmail use an App Password (not your normal password)."
          : "Could not send verification email. Check SMTP / Gmail App Password settings.";
      throw new Error(message);
    }
  }
}
