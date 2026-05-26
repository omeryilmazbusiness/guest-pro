import { getEmailDeliveryMode } from "../../config/smtp-config";
import type { IEmailSender } from "./email-sender";
import { ConsoleEmailSender } from "./console-email-sender";
import { SmtpEmailSender } from "./smtp-email-sender";

let instance: IEmailSender | null = null;

export function getEmailSender(): IEmailSender {
  if (!instance) {
    instance = getEmailDeliveryMode() === "smtp" ? new SmtpEmailSender() : new ConsoleEmailSender();
  }
  return instance;
}

export { getEmailDeliveryMode };
