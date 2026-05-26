/**
 * Verify platform OTP email delivery (Gmail App Password or SMTP_*).
 *
 *   pnpm exec tsx scripts/src/test-platform-smtp.ts recipient@example.com
 */
import "dotenv/config";
import nodemailer from "nodemailer";

function resolveSmtp() {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (gmailUser && gmailPass) {
    return {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: gmailUser,
      pass: gmailPass,
      from: process.env.SMTP_FROM ?? `Guest Pro <${gmailUser}>`,
    };
  }
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;
  return {
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    from: process.env.SMTP_FROM ?? `Guest Pro <${user}>`,
  };
}

async function main() {
  const to = process.argv[2]?.trim();
  if (!to) {
    console.error("Usage: test-platform-smtp.ts <recipient-email>");
    process.exit(1);
  }

  const smtp = resolveSmtp();
  if (!smtp) {
    console.error("Set GMAIL_USER + GMAIL_APP_PASSWORD or SMTP_HOST/USER/PASS in .env");
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    ...(smtp.port === 587 && !smtp.secure ? { requireTLS: true } : {}),
  });

  await transport.verify();
  console.log("SMTP connection OK");

  const info = await transport.sendMail({
    from: smtp.from,
    to,
    subject: "Guest Pro — SMTP test",
    text: "If you received this, platform OTP emails will work.",
  });

  console.log(`Sent test email to ${to} (messageId=${info.messageId})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
