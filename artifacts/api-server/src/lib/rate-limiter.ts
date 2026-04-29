/**
 * rate-limiter.ts
 * Unified rate-limiting primitives backed by Redis (production) with a
 * transparent in-memory fallback for local development.
 *
 * Uses the rate-limiter-flexible library so the same interface works with
 * both backends — no call-site changes when Redis is available.
 *
 * Exported limiters
 * ─────────────────
 * loginLimiter        10 failures / 15 min → 15 min block  (per email/key)
 * chatBurstLimiter    20 messages / 60 s                   (per guestId)
 */

import {
  RateLimiterRedis,
  RateLimiterMemory,
  RateLimiterAbstract,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { redisClient } from "./redis";
import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Factory — picks Redis or Memory backend transparently
// ---------------------------------------------------------------------------

function makeLimiter(
  opts: Omit<ConstructorParameters<typeof RateLimiterRedis>[0], "storeClient">
): RateLimiterAbstract {
  if (redisClient) {
    return new RateLimiterRedis({ storeClient: redisClient, ...opts });
  }
  logger.warn(
    { keyPrefix: opts.keyPrefix },
    "rate-limiter: no Redis client, using in-memory store"
  );
  // RateLimiterMemory accepts the same options minus storeClient
  return new RateLimiterMemory(opts);
}

// ---------------------------------------------------------------------------
// Login brute-force limiter
// 10 failures within 15 min → 15-min block  (matches previous in-memory logic)
// ---------------------------------------------------------------------------
export const loginLimiter = makeLimiter({
  keyPrefix:        "rl:login",
  points:           10,           // max failures
  duration:         15 * 60,      // 15 min window (seconds)
  blockDuration:    15 * 60,      // block for 15 min after limit
});

// ---------------------------------------------------------------------------
// Chat burst limiter
// 20 messages per guest per 60 s
// ---------------------------------------------------------------------------
export const chatBurstLimiter = makeLimiter({
  keyPrefix:        "rl:chat:burst",
  points:           20,
  duration:         60,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

/**
 * Check whether `key` is within the allowed window.
 * Does NOT consume a point — use `consume()` on failure paths.
 */
export async function checkLimit(
  limiter: RateLimiterAbstract,
  key: string
): Promise<RateLimitResult> {
  try {
    await limiter.consume(key, 0); // 0 points = read-only check
    return { allowed: true };
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      return { allowed: false, retryAfterMs: Math.ceil(e.msBeforeNext) };
    }
    throw e;
  }
}

/**
 * Consume one point from `limiter` for `key`.
 * Returns `{ allowed: false }` when the limit is breached.
 */
export async function consumeLimit(
  limiter: RateLimiterAbstract,
  key: string
): Promise<RateLimitResult> {
  try {
    await limiter.consume(key);
    return { allowed: true };
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      return { allowed: false, retryAfterMs: Math.ceil(e.msBeforeNext) };
    }
    throw e;
  }
}

/** Delete all failure records for `key` (called on successful login). */
export async function clearLimit(
  limiter: RateLimiterAbstract,
  key: string
): Promise<void> {
  try {
    await limiter.delete(key);
  } catch (err) {
    logger.warn({ err, key }, "rate-limiter: failed to clear key");
  }
}
