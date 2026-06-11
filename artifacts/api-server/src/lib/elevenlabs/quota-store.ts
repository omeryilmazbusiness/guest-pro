import { getRedisClient, isRedisCommandError } from "../redis";
import { logger } from "../logger";

export interface TtsQuotaSnapshot {
  monthKey: string;
  used: number;
  limit: number;
  remaining: number;
}

function monthKeyFor(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function redisUsageKey(monthKey: string): string {
  return `elevenlabs:tts:chars:${monthKey}`;
}

/** In-memory fallback when Redis is unavailable (single-instance dev). */
const memoryUsage = new Map<string, number>();

let quotaUsesMemory = false;

function fallbackQuotaToMemory(err: unknown): void {
  if (quotaUsesMemory) return;
  quotaUsesMemory = true;
  logger.warn(
    { err },
    "ElevenLabs quota: Redis failed — using in-memory counter (best-effort)",
  );
}

/** Test-only: clears in-memory quota between unit tests. */
export function resetElevenLabsQuotaMemoryForTests(): void {
  memoryUsage.clear();
  quotaUsesMemory = false;
}

export class ElevenLabsQuotaStore {
  constructor(private readonly monthlyLimit: number) {}

  async getSnapshot(): Promise<TtsQuotaSnapshot> {
    const monthKey = monthKeyFor();
    const used = await this.getUsed(monthKey);
    const remaining = Math.max(0, this.monthlyLimit - used);
    return { monthKey, used, limit: this.monthlyLimit, remaining };
  }

  async canConsume(chars: number): Promise<boolean> {
    if (chars <= 0) return true;
    const snap = await this.getSnapshot();
    return snap.remaining >= chars;
  }

  /**
   * Reserve character usage atomically. Returns false when quota would be exceeded.
   */
  async tryConsume(chars: number): Promise<boolean> {
    if (chars <= 0) return true;

    const monthKey = monthKeyFor();
    const redis = getRedisClient();

    if (redis && !quotaUsesMemory) {
      try {
        const key = redisUsageKey(monthKey);
        const script = `
        local used = tonumber(redis.call('GET', KEYS[1]) or '0')
        local next = used + tonumber(ARGV[1])
        if next > tonumber(ARGV[2]) then
          return 0
        end
        redis.call('SET', KEYS[1], next)
        if used == 0 then
          redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
        end
        return 1
      `;
        const ttlSeconds = 60 * 60 * 24 * 40;
        const ok = await redis.eval(
          script,
          1,
          key,
          String(chars),
          String(this.monthlyLimit),
          String(ttlSeconds),
        );
        return ok === 1;
      } catch (err) {
        if (isRedisCommandError(err)) {
          fallbackQuotaToMemory(err);
        } else {
          throw err;
        }
      }
    }

    const used = memoryUsage.get(monthKey) ?? 0;
    if (used + chars > this.monthlyLimit) return false;
    memoryUsage.set(monthKey, used + chars);
    return true;
  }

  async release(chars: number): Promise<void> {
    if (chars <= 0) return;
    const monthKey = monthKeyFor();
    const redis = getRedisClient();
    if (redis && !quotaUsesMemory) {
      try {
        const key = redisUsageKey(monthKey);
        const next = await redis.decrby(key, chars);
        if (next < 0) await redis.set(key, "0");
        return;
      } catch (err) {
        if (isRedisCommandError(err)) {
          fallbackQuotaToMemory(err);
        } else {
          throw err;
        }
      }
    }
    memoryUsage.set(monthKey, Math.max(0, (memoryUsage.get(monthKey) ?? 0) - chars));
  }

  private async getUsed(monthKey: string): Promise<number> {
    const redis = getRedisClient();
    if (redis && !quotaUsesMemory) {
      try {
        const raw = await redis.get(redisUsageKey(monthKey));
        return raw ? parseInt(raw, 10) : 0;
      } catch (err) {
        if (isRedisCommandError(err)) {
          fallbackQuotaToMemory(err);
        } else {
          throw err;
        }
      }
    }
    return memoryUsage.get(monthKey) ?? 0;
  }
}
