/** Abstraction for outbound email (DIP). */
export interface SendEmailInput {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  /** Visitor email — replies go to the person who filled the form */
  replyTo?: string;
}

export interface IEmailSender {
  send(input: SendEmailInput): Promise<void>;
}
