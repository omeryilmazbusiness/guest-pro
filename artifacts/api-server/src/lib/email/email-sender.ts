/** Abstraction for outbound email (DIP). */
export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IEmailSender {
  send(input: SendEmailInput): Promise<void>;
}
