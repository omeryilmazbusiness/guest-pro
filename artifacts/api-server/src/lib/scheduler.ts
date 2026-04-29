/**
 * scheduler.ts
 * Daily summary auto-generation scheduler.
 *
 * Runs a 60-second heartbeat that triggers at 23:30 UTC for all hotels.
 * Idempotent — skips generation if a summary for today already exists.
 *
 * T-11: Multi-instance safety via distributed Redis lock.
 * When REDIS_URL is set, only one instance acquires the lock per day and
 * runs the job. In dev (no Redis), the in-process guard (lastTriggeredDate)
 * is sufficient since only one process runs.
 */

import { db, hotelsTable, dailySummariesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { buildAnalyticsSnapshot, todayRange, utcDateString } from "./request-analytics";
import { generateAISummary } from "./ai-summary";
import { logger } from "./logger";
import { redisClient } from "./redis";

const TRIGGER_HOUR_UTC   = 23;
const TRIGGER_MINUTE_UTC = 30;

// In-process guard — sufficient when running a single instance or without Redis.
let lastTriggeredDate: string | null = null;

// ---------------------------------------------------------------------------
// Distributed lock helpers (Redis SET NX EX)
// ---------------------------------------------------------------------------
const LOCK_TTL_SEC = 10 * 60; // 10 minutes — enough to finish all hotels

async function acquireLock(date: string): Promise<boolean> {
  if (!redisClient) {
    // No Redis — fall back to in-process guard (dev only)
    if (lastTriggeredDate === date) return false;
    lastTriggeredDate = date;
    return true;
  }
  // SET key value NX EX ttl — atomic, returns "OK" only when key did not exist
  const result = await redisClient.set(
    `scheduler:daily-summary:${date}`,
    "1",
    "EX",
    LOCK_TTL_SEC,
    "NX"
  );
  return result === "OK";
}

// ---------------------------------------------------------------------------
// Job logic
// ---------------------------------------------------------------------------
async function generateForAllHotels(): Promise<void> {
  const today = utcDateString();

  const acquired = await acquireLock(today);
  if (!acquired) {
    logger.debug({ today }, "Scheduler: lock not acquired — another instance is handling this run");
    return;
  }

  logger.info({ today }, "Scheduler: lock acquired, starting daily summary generation");

  const hotels = await db.select({ id: hotelsTable.id }).from(hotelsTable);

  for (const hotel of hotels) {
    try {
      const existing = await db
        .select({ id: dailySummariesTable.id })
        .from(dailySummariesTable)
        .where(
          and(
            eq(dailySummariesTable.hotelId, hotel.id),
            eq(dailySummariesTable.date, today)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        logger.info({ hotelId: hotel.id, date: today }, "Daily summary already exists, skipping");
        continue;
      }

      const { start, end } = todayRange();
      const snapshot = await buildAnalyticsSnapshot(hotel.id, start, end);
      const { insights, recommendations } = await generateAISummary(snapshot);

      await db.insert(dailySummariesTable).values({
        hotelId: hotel.id,
        date:    today,
        insights,
        recommendations,
        metricsSnapshot: snapshot as unknown as Record<string, unknown>,
      });

      logger.info({ hotelId: hotel.id, date: today }, "Daily summary generated");
    } catch (err) {
      logger.error({ hotelId: hotel.id, date: today, err }, "Failed to generate daily summary");
    }
  }
}

// ---------------------------------------------------------------------------
// Scheduler bootstrap
// ---------------------------------------------------------------------------
export function startScheduler(): void {
  setInterval(() => {
    const now = new Date();
    if (
      now.getUTCHours()   === TRIGGER_HOUR_UTC &&
      now.getUTCMinutes() === TRIGGER_MINUTE_UTC
    ) {
      generateForAllHotels().catch((err) =>
        logger.error({ err }, "Scheduler: unhandled error in generateForAllHotels")
      );
    }
  }, 60_000);

  logger.info(
    {
      triggerHour:   TRIGGER_HOUR_UTC,
      triggerMinute: TRIGGER_MINUTE_UTC,
      backend:       redisClient ? "redis" : "in-memory",
    },
    "Daily summary scheduler started"
  );
}
