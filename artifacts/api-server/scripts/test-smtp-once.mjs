import { config } from "dotenv";
import nodemailer from "nodemailer";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

const user = process.env.GMAIL_USER?.trim();
const pass = process.env.GMAIL_APP_PASSWORD?.trim();
const to = process.argv[2] ?? user;

if (!user || !pass) {
  console.error("Set GMAIL_USER and GMAIL_APP_PASSWORD in .env");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user, pass },
  requireTLS: true,
});

try {
  await transport.verify();
  console.log("SMTP verify OK");
  const info = await transport.sendMail({
    from: process.env.SMTP_FROM ?? `Guest Pro <${user}>`,
    to,
    subject: "Guest Pro — SMTP test",
    text: `Platform OTP email test at ${new Date().toISOString()}`,
  });
  console.log(`Sent to ${to} (messageId=${info.messageId})`);
} catch (err) {
  console.error("FAILED:", err.message ?? err);
  process.exit(1);
}
