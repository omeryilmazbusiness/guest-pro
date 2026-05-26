import { config } from "dotenv";
import nodemailer from "nodemailer";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function normalizeAppPassword(raw) {
  if (!raw) return undefined;
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/\s+/g, "");
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(root, ".env"), override: true });

const user = process.env.GMAIL_USER?.trim();
const pass = normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);
const to = process.argv[2] ?? user;

if (!user || !pass) {
  console.error("Set GMAIL_USER and GMAIL_APP_PASSWORD in .env");
  process.exit(1);
}

console.log("Password length:", pass.length, pass.length === 16 ? "(ok)" : "(expected 16)");

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user, pass },
  connectionTimeout: 10_000,
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
