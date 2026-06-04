/**
 * POST /api/public/contact — Guest Pro marketing contact form (no auth).
 */
import { Router, type IRouter } from "express";
import { z } from "zod";
import { getEmailSender } from "../lib/email/create-email-sender";
import { logger } from "../lib/logger";

/** Fixed inbox for all contact form submissions */
const CONTACT_INBOX = "omerfarukyilmazrbusiness@gmail.com";

const contactSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z.string().trim().email().max(254),
	comments: z.string().trim().min(1).max(8000),
});

const router: IRouter = Router();

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function successHtml(name: string): string {
	const safe = escapeHtml(name);
	return `<fieldset><div id="success_page"><h3>Email sent successfully.</h3><p>Thank you <strong>${safe}</strong> — we received your message and will respond shortly.</p></div></fieldset>`;
}

function errorHtml(message: string): string {
	return `<div class="error_message">${escapeHtml(message)}</div>`;
}

router.post("/public/contact", async (req, res): Promise<void> => {
	const parsed = contactSchema.safeParse(req.body);
	if (!parsed.success) {
		const msg = parsed.error.issues[0]?.message ?? "Invalid form data.";
		res.status(400).send(errorHtml(msg));
		return;
	}

	const { name, email, comments } = parsed.data;
	const subject = `Guest Pro — contact from ${name}`;
	const text = [
		"New message from the Guest Pro website contact form.",
		"",
		`Name: ${name}`,
		`Email: ${email}`,
		"",
		"Message:",
		comments,
	].join("\n");

	const html = [
		"<p>New message from the <strong>Guest Pro</strong> website contact form.</p>",
		`<p><strong>Name:</strong> ${escapeHtml(name)}<br>`,
		`<strong>Email:</strong> ${escapeHtml(email)}</p>`,
		`<p><strong>Message:</strong></p>`,
		`<p>${escapeHtml(comments).replace(/\n/g, "<br>")}</p>`,
	].join("");

	try {
		await getEmailSender().send({
			to: CONTACT_INBOX,
			subject,
			text,
			html,
			// Visitor address — for Reply only; delivery is always CONTACT_INBOX
			replyTo: email,
		});
		logger.info(
			{ to: CONTACT_INBOX, submitterEmail: email },
			"public-contact:sent",
		);
		res.status(200).send(successHtml(name));
	} catch (err) {
		logger.error({ err, to: CONTACT_INBOX }, "public-contact:send-failed");
		res
			.status(503)
			.send(
				errorHtml(
					"We could not send your message right now. Please email us directly or try again shortly.",
				),
			);
	}
});

export default router;
