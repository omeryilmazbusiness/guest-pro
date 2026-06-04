import { withAsyncTimeout } from "../async-timeout";
import { logger } from "../logger";
import type { IEmailSender, SendEmailInput } from "./email-sender";

const RESEND_TIMEOUT_MS = 15_000;

function mapResendApiError(status: number, apiMessage: string, to: string): string {
  if (status === 401) {
    return "Invalid RESEND_API_KEY on the server. Create a new key at resend.com/api-keys.";
  }
  if (status === 403 && /only send testing emails/i.test(apiMessage)) {
    return (
      `Resend test mode: OTP can only be sent to your Resend account email, not ${to}. ` +
      "Either use that email as the platform verification address, or verify guest-pro.com on Resend " +
      "and set RESEND_FROM=Guest Pro <noreply@www.guest-pro.com> on Railway."
    );
  }
  if (
    (status === 403 || status === 422) &&
    /not verified|verify your domain/i.test(apiMessage)
  ) {
    return (
      `${apiMessage} The server will auto-use your verified Resend domain name on next deploy. ` +
      "In Resend, check the exact domain label (guest-pro.com vs www.guest-pro.com) — From must match."
    );
  }
  if (status === 422 && /invalid.*from/i.test(apiMessage)) {
    return "Invalid RESEND_FROM. Remove it on Railway to auto-detect, or match your verified Resend domain exactly.";
  }
  return apiMessage;
}

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
    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const body: Record<string, unknown> = {
      from: this.from,
      to: recipients,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br>"),
    };
    if (input.replyTo) {
      body.reply_to = input.replyTo;
    }

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
        const apiMessage = data.message ?? `Resend API error (${res.status})`;
        logger.error({ status: res.status, data, to: input.to }, "resend:api-error");
        throw new Error(mapResendApiError(res.status, apiMessage, recipients[0] ?? ""));
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
