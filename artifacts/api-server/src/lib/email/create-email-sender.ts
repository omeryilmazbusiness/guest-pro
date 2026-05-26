import { getEmailDeliveryMode, getResendApiKey, getResendFrom } from "../../config/email-delivery";
import type { IEmailSender } from "./email-sender";
import { ConsoleEmailSender } from "./console-email-sender";
import { ResendEmailSender } from "./resend-email-sender";
import { SmtpEmailSender } from "./smtp-email-sender";

let instance: IEmailSender | null = null;

export function getEmailSender(): IEmailSender {
  if (!instance) {
    const mode = getEmailDeliveryMode();
    if (mode === "resend") {
      instance = new ResendEmailSender(getResendApiKey()!, getResendFrom());
    } else if (mode === "smtp") {
      instance = new SmtpEmailSender();
    } else {
      instance = new ConsoleEmailSender();
    }
  }
  return instance;
}

export { getEmailDeliveryMode };
