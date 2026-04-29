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

export const env = {
  NODE_ENV: optionalEnv("NODE_ENV", "development") as "development" | "production" | "test",
  SESSION_SECRET: optionalEnv("SESSION_SECRET", "guestpro_dev_secret_change_in_production"),

  // T-08: DATABASE_URL is required — fail fast at startup if missing.
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // T-10: Connection pool tuning — override via env to match your deployment.
  DB_POOL_MAX: optionalInt("DB_POOL_MAX", 10),
  DB_POOL_IDLE_TIMEOUT_MS: optionalInt("DB_POOL_IDLE_TIMEOUT_MS", 30_000),
  DB_POOL_CONNECTION_TIMEOUT_MS: optionalInt("DB_POOL_CONNECTION_TIMEOUT_MS", 5_000),

  GOOGLE_CLIENT_ID: optionalEnv("AUTH_GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optionalEnv("AUTH_GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: optionalEnv("AUTH_GOOGLE_REDIRECT_URI"),
  APP_BASE_URL: optionalEnv("APP_BASE_URL"),
  ALLOWED_ORIGIN: optionalEnv("ALLOWED_ORIGIN"),

  // T-06: Number of trusted reverse-proxy hops in front of the server.
  // 0 = no proxy (direct), 1 = single LB/nginx, 2 = LB + nginx, etc.
  TRUST_PROXY_HOPS: optionalInt("TRUST_PROXY_HOPS", 1),

  get isGoogleConfigured() {
    return !!(this.GOOGLE_CLIENT_ID && this.GOOGLE_CLIENT_SECRET);
  },
};

// ── Production guards — fail fast before the server accepts any traffic ──────
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
  if (!process.env.REDIS_URL) {
    throw new Error(
      "[FATAL] REDIS_URL is required in production. " +
        "Set it to your Redis connection string before deploying."
    );
  }
  if (!env.ALLOWED_ORIGIN) {
    throw new Error(
      "[FATAL] ALLOWED_ORIGIN is required in production. " +
        "Set it to your frontend origin (e.g. https://app.example.com)."
    );
  }
}
