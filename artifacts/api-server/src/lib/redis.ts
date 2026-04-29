/**
 * redis.ts
 * Singleton Redis client used for:
 *   - Rate limiting (login brute-force + chat burst)
 *   - OAuth state store (oauthStateStore, googleExchangeCodes)
 *   - Distributed scheduler lock
 *
 * When REDIS_URL is not set (local dev without Redis) the module exports a
 * null client and callers fall back to their in-memory implementations.
 */

import Redis from "ioredis";
import { logger } from "./logger";

let _client: Redis | null = null;

function createClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[FATAL] REDIS_URL is required in production. " +
          "Set it to your Redis connection string before deploying."
      );
    }
    logger.warn(
      "REDIS_URL not set — falling back to in-memory stores. " +
        "This is NOT safe for multi-instance or production deployments."
    );
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    // Reconnect with capped exponential back-off
    retryStrategy(times) {
      if (times > 10) {
        logger.error("Redis: max reconnect attempts reached");
        return null; // stop retrying
      }
      return Math.min(times * 200, 3000);
    },
  });

  client.on("connect", () => logger.info("Redis: connected"));
  client.on("ready", () => logger.info("Redis: ready"));
  client.on("error", (err) => logger.error({ err }, "Redis: error"));
  client.on("close", () => logger.warn("Redis: connection closed"));
  client.on("reconnecting", () => logger.info("Redis: reconnecting"));

  return client;
}

export function getRedisClient(): Redis | null {
  if (_client === undefined) {
    _client = createClient();
  }
  return _client;
}

// Initialise eagerly so connection errors surface at startup
_client = createClient();

export { _client as redisClient };

export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}
