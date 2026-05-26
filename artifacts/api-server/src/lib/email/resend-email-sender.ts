import { withAsyncTimeout } from "../async-timeout";
import { logger } from "../logger";
import type { IEmailSender, SendEmailInput } from "./email-sender";

const RESEND_TIMEOUT_MS = 15_000;

/**
 * HTTPS transactional email — reliable on Railway (no SMTP port blocking).
 * https://resend.com — set RESEND_API_KEY in production.
 */
export class ResendEmailSender implements IEmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(input: SendEmailInput): Promise<void> {
    const body = {
      from: this.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br>"),
    };

    try {
      const res = await withAsyncTimeout(
        "resend api",
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
        RESEND_TIMEOUT_MS,
      );

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        id?: string;
      };

      if (!res.ok) {
        logger.error({ status: res.status, data }, "resend:api-error");
        throw new Error(data.message ?? `Resend API error (${res.status})`);
      }

      logger.info({ to: input.to, id: data.id }, "resend:sent");
    } catch (err) {
      logger.error({ err, to: input.to }, "resend:send-failed");
      throw new Error(
        err instanceof Error ? err.message : "Could not send verification email via Resend",
      );
    }
  }
}
