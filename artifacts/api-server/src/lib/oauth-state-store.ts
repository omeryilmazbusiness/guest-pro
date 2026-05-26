/**
 * oauth-state-store.ts
 * Redis-backed store for Google OAuth CSRF state tokens and single-use
 * exchange codes. Falls back to in-memory Maps when Redis is unavailable
 * (local dev only — NOT safe for multi-instance deployments).
 */

import { redisClient } from "./redis";
import { logger } from "./logger";

const STATE_TTL_SEC = 5 * 60; // 5 minutes
const EXCHANGE_TTL_SEC = 60; // 60 seconds

export interface OAuthStateMeta {
  hotelSlug?: string;
}

// ── In-memory fallback stores ────────────────────────────────────────────────
const memStateStore = new Map<string, { expiresAt: number; meta: OAuthStateMeta }>();
const memExchangeStore = new Map<string, { token: string; expiresAt: number }>();

// ── Key helpers ──────────────────────────────────────────────────────────────
const stateKey = (state: string) => `oauth:state:${state}`;
const exchangeKey = (code: string) => `oauth:exchange:${code}`;

// ============================================================================
// OAuth CSRF state
// ============================================================================

export async function saveOAuthState(state: string, meta: OAuthStateMeta = {}): Promise<void> {
  const payload = JSON.stringify(meta);
  if (redisClient) {
    await redisClient.set(stateKey(state), payload, "EX", STATE_TTL_SEC);
    return;
  }
  memStateStore.set(state, { expiresAt: Date.now() + STATE_TTL_SEC * 1000, meta });
}

export async function consumeOAuthState(state: string): Promise<OAuthStateMeta | null> {
  if (redisClient) {
    const result = (await redisClient.eval(
      `local v = redis.call('GET', KEYS[1])
       if v then redis.call('DEL', KEYS[1]) return v else return false end`,
      1,
      stateKey(state),
    )) as string | null;
    if (!result) return null;
    try {
      return JSON.parse(result) as OAuthStateMeta;
    } catch {
      return {};
    }
  }
  const entry = memStateStore.get(state);
  if (!entry) return null;
  memStateStore.delete(state);
  if (Date.now() > entry.expiresAt) return null;
  return entry.meta;
}

// ============================================================================
// Google exchange codes  (single-use, 60 s)
// ============================================================================

export async function saveExchangeCode(code: string, token: string): Promise<void> {
  if (redisClient) {
    await redisClient.set(exchangeKey(code), token, "EX", EXCHANGE_TTL_SEC);
    return;
  }
  memExchangeStore.set(code, { token, expiresAt: Date.now() + EXCHANGE_TTL_SEC * 1000 });
}

export async function consumeExchangeCode(code: string): Promise<string | null> {
  if (redisClient) {
    const result = (await redisClient.eval(
      `local v = redis.call('GET', KEYS[1])
       if v then redis.call('DEL', KEYS[1]) return v else return false end`,
      1,
      exchangeKey(code),
    )) as string | null;
    return result ?? null;
  }
  const entry = memExchangeStore.get(code);
  if (!entry) return null;
  memExchangeStore.delete(code);
  if (Date.now() > entry.expiresAt) return null;
  return entry.token;
}

// ── Periodic in-memory cleanup (dev only) ────────────────────────────────────
if (!redisClient) {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memStateStore) if (now > v.expiresAt) memStateStore.delete(k);
    for (const [k, v] of memExchangeStore) if (now > v.expiresAt) memExchangeStore.delete(k);
  }, 60_000);
  logger.warn("oauth-state-store: using in-memory fallback");
}
