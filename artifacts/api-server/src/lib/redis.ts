/**
 * redis.ts
 * Singleton Redis client used for:
 *   - Rate limiting (login brute-force + chat burst)
 *   - OAuth state store
 *   - Distributed scheduler lock
 *
 * Call initRedis() during API startup. When REDIS_URL is missing or unreachable
 * in development, redisClient stays null and callers use in-memory fallbacks.
 */

import Redis from "ioredis";
import { logger } from "./logger";

export let redisClient: Redis | null = null;

let initDone = false;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function buildClient(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 5_000,
    commandTimeout: 3_000,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 300, 2_000);
    },
  });
}

/** Ping Redis at startup; disable client in dev when unreachable. */
export async function initRedis(): Promise<void> {
  if (initDone) return;
  initDone = true;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    if (isProduction()) {
      throw new Error(
        "[FATAL] REDIS_URL is required in production. Set it before deploying.",
      );
    }
    logger.warn(
      "REDIS_URL not set — using in-memory stores (dev only, not multi-instance safe).",
    );
    redisClient = null;
    return;
  }

  const client = buildClient(url);

  try {
    await client.connect();
    await client.ping();
    client.on("error", (err) => logger.error({ err }, "Redis: error"));
    client.on("close", () => logger.warn("Redis: connection closed"));
    redisClient = client;
    logger.info("Redis: connected");
  } catch (err) {
    try {
      client.disconnect();
    } catch {
      /* ignore */
    }
    redisClient = null;

    if (isProduction()) {
      throw new Error(
        `Redis unavailable at startup: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    logger.warn(
      { err },
      "Redis unreachable (timeout or wrong REDIS_URL) — using in-memory fallbacks for local dev. " +
        "Unset REDIS_URL or point it to localhost:6379 to silence this.",
    );
  }
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisCommandError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = String((err as Error).message ?? "");
  const name = String((err as Error).name ?? "");
  return (
    message.includes("Command timed out") ||
    message.includes("Connection is closed") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ENOTFOUND") ||
    name === "MaxRetriesPerRequestError"
  );
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  initDone = false;
}
