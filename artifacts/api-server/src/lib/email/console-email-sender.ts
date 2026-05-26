import { logger } from "../logger";
import type { IEmailSender, SendEmailInput } from "./email-sender";

/** Development fallback — logs OTP to server console (never use in production). */
export class ConsoleEmailSender implements IEmailSender {
  async send(input: SendEmailInput): Promise<void> {
    logger.warn(
      { to: input.to, subject: input.subject, body: input.text },
      "email:console-fallback (configure SMTP for production)",
    );
  }
}
