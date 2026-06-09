/**
 * rate-limiter.ts
 * Login + chat rate limits — Redis in production, in-memory fallback in dev or when
 * Redis is unavailable.
 */

import {
  RateLimiterRedis,
  RateLimiterMemory,
  RateLimiterAbstract,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { redisClient, isRedisCommandError } from "./redis";
import { logger } from "./logger";

const LOGIN_OPTS = {
  keyPrefix: "rl:login",
  points: 10,
  duration: 15 * 60,
  blockDuration: 15 * 60,
} as const;

const CHAT_OPTS = {
  keyPrefix: "rl:chat:burst",
  points: 20,
  duration: 60,
} as const;

const memoryLoginLimiter = new RateLimiterMemory(LOGIN_OPTS);
const memoryChatBurstLimiter = new RateLimiterMemory(CHAT_OPTS);

let redisLoginLimiter: RateLimiterAbstract | null = null;
let redisChatBurstLimiter: RateLimiterAbstract | null = null;
let loginUsesMemory = false;
let chatUsesMemory = false;

function pickLimiter(
  redisKey: "login" | "chat",
  memory: RateLimiterMemory,
  usesMemoryFlag: "login" | "chat",
): RateLimiterAbstract {
  if (usesMemoryFlag === "login" && loginUsesMemory) return memory;
  if (usesMemoryFlag === "chat" && chatUsesMemory) return memory;

  if (!redisClient) return memory;

  if (redisKey === "login") {
    if (!redisLoginLimiter) {
      redisLoginLimiter = new RateLimiterRedis({ storeClient: redisClient, ...LOGIN_OPTS });
    }
    return redisLoginLimiter;
  }

  if (!redisChatBurstLimiter) {
    redisChatBurstLimiter = new RateLimiterRedis({ storeClient: redisClient, ...CHAT_OPTS });
  }
  return redisChatBurstLimiter;
}

function fallbackToMemory(kind: "login" | "chat", err: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  logger.warn({ err, kind }, "rate-limiter: Redis failed — using in-memory store for dev");
  if (kind === "login") {
    loginUsesMemory = true;
    redisLoginLimiter = memoryLoginLimiter;
  } else {
    chatUsesMemory = true;
    redisChatBurstLimiter = memoryChatBurstLimiter;
  }
}

async function withLimiter<T>(
  kind: "login" | "chat",
  memory: RateLimiterMemory,
  fn: (limiter: RateLimiterAbstract) => Promise<T>,
): Promise<T> {
  const limiter = pickLimiter(kind, memory, kind);
  try {
    return await fn(limiter);
  } catch (err) {
    if (limiter !== memory && isRedisCommandError(err)) {
      fallbackToMemory(kind, err);
      return fn(memory);
    }
    throw err;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

export async function checkLimit(
  _limiter: RateLimiterAbstract,
  key: string,
): Promise<RateLimitResult> {
  return withLimiter("login", memoryLoginLimiter, async (limiter) => {
    try {
      await limiter.consume(key, 0);
      return { allowed: true };
    } catch (e) {
      if (e instanceof RateLimiterRes) {
        return { allowed: false, retryAfterMs: Math.ceil(e.msBeforeNext) };
      }
      throw e;
    }
  });
}

export async function consumeLimit(
  _limiter: RateLimiterAbstract,
  key: string,
): Promise<RateLimitResult> {
  return withLimiter("login", memoryLoginLimiter, async (limiter) => {
    try {
      await limiter.consume(key);
      return { allowed: true };
    } catch (e) {
      if (e instanceof RateLimiterRes) {
        return { allowed: false, retryAfterMs: Math.ceil(e.msBeforeNext) };
      }
      throw e;
    }
  });
}

export async function clearLimit(
  _limiter: RateLimiterAbstract,
  key: string,
): Promise<void> {
  try {
    await withLimiter("login", memoryLoginLimiter, (limiter) => limiter.delete(key));
  } catch (err) {
    logger.warn({ err, key }, "rate-limiter: failed to clear key");
  }
}

export async function checkChatBurstRateLimit(guestId: number): Promise<RateLimitResult> {
  return withLimiter("chat", memoryChatBurstLimiter, async (limiter) => {
    try {
      await limiter.consume(String(guestId));
      return { allowed: true };
    } catch (e) {
      if (e instanceof RateLimiterRes) {
        return { allowed: false, retryAfterMs: Math.ceil(e.msBeforeNext) };
      }
      throw e;
    }
  });
}

/** @deprecated Use checkLimit directly — kept for auth.ts imports */
export const loginLimiter = memoryLoginLimiter;

/** @deprecated Use checkChatBurstRateLimit — kept for re-exports */
export const chatBurstLimiter = memoryChatBurstLimiter;
