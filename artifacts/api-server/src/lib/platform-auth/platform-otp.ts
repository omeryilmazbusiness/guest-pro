import crypto from "crypto";
import { env } from "../../config/env";

const OTP_TTL_MS = 3 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export function generateOtpCode(): string {
  return String(crypto.randomInt(100_000, 1_000_000));
}

export function hashOtpCode(code: string): string {
  return crypto
    .createHmac("sha256", env.SESSION_SECRET!)
    .update(`platform-otp:${code.trim()}`)
    .digest("hex");
}

export function verifyOtpCode(code: string, hash: string): boolean {
  const expected = hashOtpCode(code);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export const PLATFORM_OTP = {
  ttlMs: OTP_TTL_MS,
  maxVerifyAttempts: MAX_VERIFY_ATTEMPTS,
} as const;

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
