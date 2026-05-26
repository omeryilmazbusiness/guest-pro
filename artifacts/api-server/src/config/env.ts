function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`[FATAL] Missing required environment variable: ${name}`);
  return val;
}

function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

function optionalInt(name: string, fallback: number): number {
  const val = process.env[name];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed))
    throw new Error(`Environment variable ${name} must be an integer, got: "${val}"`);
  return parsed;
}

function optionalBool(name: string, fallback: boolean): boolean {
  const val = process.env[name];
  if (val === undefined) return fallback;
  return val === "1" || val.toLowerCase() === "true";
}

import { normalizeAppPassword } from "./normalize-secret";

export const env = {
  NODE_ENV: optionalEnv("NODE_ENV", "development") as "development" | "production" | "test",
  SESSION_SECRET: optionalEnv("SESSION_SECRET", "guestpro_dev_secret_change_in_production"),

  DATABASE_URL: requireEnv("DATABASE_URL"),

  DB_POOL_MAX: optionalInt("DB_POOL_MAX", 10),
  DB_POOL_IDLE_TIMEOUT_MS: optionalInt("DB_POOL_IDLE_TIMEOUT_MS", 30_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: optionalInt("DB_POOL_CONNECTION_TIMEOUT_MS", 5_000),

  GOOGLE_CLIENT_ID: optionalEnv("AUTH_GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optionalEnv("AUTH_GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: optionalEnv("AUTH_GOOGLE_REDIRECT_URI"),
  APP_BASE_URL: optionalEnv("APP_BASE_URL"),
  DEFAULT_HOTEL_SLUG: optionalEnv("DEFAULT_HOTEL_SLUG"),
  ALLOWED_ORIGIN: optionalEnv("ALLOWED_ORIGIN"),

  TRUST_PROXY_HOPS: optionalInt("TRUST_PROXY_HOPS", 1),

  /** Default until changed in platform settings UI */
  PLATFORM_VERIFICATION_EMAIL_DEFAULT:
    optionalEnv("PLATFORM_VERIFICATION_EMAIL", "ryilmazomer@gmail.com") ?? "ryilmazomer@gmail.com",

  SMTP_HOST: optionalEnv("SMTP_HOST"),
  SMTP_PORT: optionalInt("SMTP_PORT", 587),
  SMTP_SECURE: optionalBool("SMTP_SECURE", false),
  SMTP_USER: optionalEnv("SMTP_USER"),
  SMTP_PASS: optionalEnv("SMTP_PASS"),
  SMTP_FROM: optionalEnv("SMTP_FROM", "Guest Pro Platform <noreply@guestpro.local>"),

  get isGoogleConfigured() {
    return !!(this.GOOGLE_CLIENT_ID && this.GOOGLE_CLIENT_SECRET);
  },

  RESEND_API_KEY: optionalEnv("RESEND_API_KEY"),
  RESEND_FROM: optionalEnv("RESEND_FROM"),

  /** Resend or SMTP — used for production OTP. */
  get isEmailConfigured() {
    if (process.env.RESEND_API_KEY?.trim()) return true;
    const gmail =
      process.env.GMAIL_USER?.trim() && normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);
    const smtpPass =
      normalizeAppPassword(process.env.SMTP_PASS) ?? process.env.SMTP_PASS?.trim();
    return !!(gmail || (this.SMTP_HOST && this.SMTP_USER && smtpPass));
  },

  /** @deprecated use isEmailConfigured */
  get isSmtpConfigured() {
    return this.isEmailConfigured;
  },
};

if (env.NODE_ENV === "production") {
  const defaultSecret = "guestpro_dev_secret_change_in_production";

  if (env.SESSION_SECRET === defaultSecret) {
    throw new Error(
      "[FATAL] SESSION_SECRET is using the default dev value in production. " +
        "Set a strong SESSION_SECRET environment variable before deploying.",
    );
  }
  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
    throw new Error("[FATAL] SESSION_SECRET must be at least 32 characters in production.");
  }
  if (!process.env.REDIS_URL) {
    throw new Error(
      "[FATAL] REDIS_URL is required in production. " +
        "Set it to your Redis connection string before deploying.",
    );
  }
  if (!env.ALLOWED_ORIGIN) {
    throw new Error(
      "[FATAL] ALLOWED_ORIGIN is required in production. " +
        "Set it to your frontend origin (e.g. https://app.example.com).",
    );
  }
}
