import { redisClient } from "../redis";
import { logger } from "../logger";
import { withAsyncTimeout } from "../async-timeout";

const REDIS_OP_TIMEOUT_MS = 4_000;

const KEY_PREFIX = "platform:login-lockout:";
/** Password step only — OTP has its own per-challenge attempt limit. */
const FAILURES_BEFORE_LOCK = 8;
const LOCK_MS_TIER_0 = 30_000;
const LOCK_MS_TIER_1 = 300_000;

interface LockoutState {
  failureCount: number;
  lockoutTier: number;
  lockedUntil: number | null;
}

const memoryStore = new Map<string, LockoutState>();

function defaultState(): LockoutState {
  return { failureCount: 0, lockoutTier: 0, lockedUntil: null };
}

async function readState(email: string): Promise<LockoutState> {
  const key = KEY_PREFIX + email;
  if (redisClient && process.env.NODE_ENV === "production") {
    try {
      const raw = await withAsyncTimeout(
        "platform-lockout redis get",
        redisClient.get(key),
        REDIS_OP_TIMEOUT_MS,
      );
      if (!raw) return defaultState();
      return JSON.parse(raw) as LockoutState;
    } catch (err) {
      logger.warn({ err }, "platform-lockout: redis read failed");
    }
  }
  return memoryStore.get(key) ?? defaultState();
}

async function writeState(email: string, state: LockoutState): Promise<void> {
  const key = KEY_PREFIX + email;
  if (redisClient && process.env.NODE_ENV === "production") {
    try {
      const ttlSec = 24 * 60 * 60;
      await withAsyncTimeout(
        "platform-lockout redis setex",
        redisClient.setex(key, ttlSec, JSON.stringify(state)),
        REDIS_OP_TIMEOUT_MS,
      );
      return;
    } catch (err) {
      logger.warn({ err }, "platform-lockout: redis write failed");
    }
  }
  memoryStore.set(key, state);
}

export interface PlatformLockoutStatus {
  allowed: boolean;
  retryAfterMs?: number;
  message?: string;
}

export class PlatformLoginLockoutService {
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async check(email: string): Promise<PlatformLockoutStatus> {
    const state = await readState(this.normalizeEmail(email));
    const now = Date.now();
    if (state.lockedUntil && now < state.lockedUntil) {
      return {
        allowed: false,
        retryAfterMs: state.lockedUntil - now,
        message: "Too many failed password attempts. Please wait before trying again.",
      };
    }
    if (state.lockedUntil && now >= state.lockedUntil) {
      state.lockedUntil = null;
      await writeState(this.normalizeEmail(email), state);
    }
    return { allowed: true };
  }

  async recordFailure(email: string): Promise<PlatformLockoutStatus> {
    const normalized = this.normalizeEmail(email);
    const check = await this.check(normalized);
    if (!check.allowed) return check;

    const state = await readState(normalized);
    state.failureCount += 1;

    if (state.failureCount >= FAILURES_BEFORE_LOCK) {
      const lockMs = state.lockoutTier === 0 ? LOCK_MS_TIER_0 : LOCK_MS_TIER_1;
      state.lockedUntil = Date.now() + lockMs;
      state.lockoutTier = Math.min(state.lockoutTier + 1, 2);
      state.failureCount = 0;
      await writeState(normalized, state);
      return {
        allowed: false,
        retryAfterMs: lockMs,
        message:
          lockMs === LOCK_MS_TIER_0
            ? "Too many failed password attempts. Try again in 30 seconds."
            : "Too many failed password attempts. Try again in 5 minutes.",
      };
    }

    await writeState(normalized, state);
    return { allowed: true };
  }

  async clear(email: string): Promise<void> {
    const normalized = this.normalizeEmail(email);
    if (redisClient && process.env.NODE_ENV === "production") {
      try {
        await withAsyncTimeout(
          "platform-lockout redis del",
          redisClient.del(KEY_PREFIX + normalized),
          REDIS_OP_TIMEOUT_MS,
        );
      } catch {
        /* ignore */
      }
    }
    memoryStore.delete(KEY_PREFIX + normalized);
  }
}

export const platformLoginLockout = new PlatformLoginLockoutService();
