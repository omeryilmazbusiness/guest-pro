function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

export const env = {
  NODE_ENV: optionalEnv("NODE_ENV", "development") as "development" | "production" | "test",
  SESSION_SECRET: optionalEnv("SESSION_SECRET", "guestpro_dev_secret_change_in_production"),
  DATABASE_URL: process.env.DATABASE_URL,
  GOOGLE_CLIENT_ID: optionalEnv("AUTH_GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optionalEnv("AUTH_GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: optionalEnv("AUTH_GOOGLE_REDIRECT_URI"),
  APP_BASE_URL: optionalEnv("APP_BASE_URL"),
  ALLOWED_ORIGIN: optionalEnv("ALLOWED_ORIGIN"),
  get isGoogleConfigured() {
    return !!(this.GOOGLE_CLIENT_ID && this.GOOGLE_CLIENT_SECRET);
  },
};

if (env.NODE_ENV === "production") {
  const defaultSecret = "guestpro_dev_secret_change_in_production";
  if (env.SESSION_SECRET === defaultSecret) {
    throw new Error(
      "[FATAL] SESSION_SECRET is using the default dev value in production. " +
        "Set a strong SESSION_SECRET environment variable before deploying."
    );
  }
  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
    throw new Error("[FATAL] SESSION_SECRET must be at least 32 characters in production.");
  }
}
