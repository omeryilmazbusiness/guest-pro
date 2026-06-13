/**
 * scheduler.ts
 * Scheduled jobs:
 *  - 23:30 UTC — guest-request daily summaries (existing)
 *  - 18:00 Europe/Istanbul — daily task performance insights (managers)
 */

import { db, hotelsTable, dailySummariesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { buildAnalyticsSnapshot, todayRange, utcDateString } from "./request-analytics";
import { generateAISummary } from "./ai-summary";
import {
  generateDailyTaskInsightsForAllHotels,
  istanbulDateString,
  isTaskInsightTriggerTime,
} from "./daily-task-insight";
import { processDueEntryTrackSchedules } from "./entry-track-scheduler";
import { logger } from "./logger";
import { redisClient } from "./redis";

const SUMMARY_HOUR_UTC = 23;
const SUMMARY_MINUTE_UTC = 30;

let lastSummaryDate: string | null = null;
let lastTaskInsightDate: string | null = null;

const LOCK_TTL_SEC = 10 * 60;

async function acquireLock(key: string, inMemoryDate: string | null, setInMemory: (d: string) => void): Promise<boolean> {
  if (!redisClient) {
    if (inMemoryDate === key.split(":").pop()) return false;
    setInMemory(key.split(":").pop()!);
    return true;
  }
  try {
    const result = await redisClient.set(key, "1", "EX", LOCK_TTL_SEC, "NX");
    return result === "OK";
  } catch (err) {
    logger.warn({ err, key }, "Scheduler: Redis lock failed, using in-memory guard");
    if (inMemoryDate === key.split(":").pop()) return false;
    setInMemory(key.split(":").pop()!);
    return true;
  }
}

async function generateDailySummariesForAllHotels(): Promise<void> {
  const today = utcDateString();
  const lockKey = `scheduler:daily-summary:${today}`;

  const acquired = await acquireLock(lockKey, lastSummaryDate, (d) => {
    lastSummaryDate = d;
  });
  if (!acquired) {
    logger.debug({ today }, "Scheduler: daily summary lock not acquired");
    return;
  }

  logger.info({ today }, "Scheduler: starting daily summary generation");

  const hotels = await db.select({ id: hotelsTable.id }).from(hotelsTable);

  for (const hotel of hotels) {
    try {
      const existing = await db
        .select({ id: dailySummariesTable.id })
        .from(dailySummariesTable)
        .where(
          and(eq(dailySummariesTable.hotelId, hotel.id), eq(dailySummariesTable.date, today)),
        )
        .limit(1);

      if (existing.length > 0) continue;

      const { start, end } = todayRange();
      const snapshot = await buildAnalyticsSnapshot(hotel.id, start, end);
      const { insights, recommendations } = await generateAISummary(hotel.id, snapshot);

      await db.insert(dailySummariesTable).values({
        hotelId: hotel.id,
        date: today,
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

async function runDailyTaskInsightJob(): Promise<void> {
  const date = istanbulDateString();
  const lockKey = `scheduler:daily-task-insight:${date}`;

  const acquired = await acquireLock(lockKey, lastTaskInsightDate, (d) => {
    lastTaskInsightDate = d;
  });
  if (!acquired) {
    logger.debug({ date }, "Scheduler: daily task insight lock not acquired");
    return;
  }

  logger.info({ date }, "Scheduler: starting daily task insight generation");
  await generateDailyTaskInsightsForAllHotels(date);
}

export function startScheduler(): void {
  setInterval(() => {
    const now = new Date();

    processDueEntryTrackSchedules().catch((err) =>
      logger.error({ err }, "Scheduler: entry track job failed"),
    );

    if (now.getUTCHours() === SUMMARY_HOUR_UTC && now.getUTCMinutes() === SUMMARY_MINUTE_UTC) {
      generateDailySummariesForAllHotels().catch((err) =>
        logger.error({ err }, "Scheduler: daily summary job failed"),
      );
    }

    if (isTaskInsightTriggerTime(now)) {
      runDailyTaskInsightJob().catch((err) =>
        logger.error({ err }, "Scheduler: daily task insight job failed"),
      );
    }
  }, 60_000);

  logger.info(
    {
      dailySummaryUtc: `${SUMMARY_HOUR_UTC}:${String(SUMMARY_MINUTE_UTC).padStart(2, "0")}`,
      taskInsightLocal: "18:00 Europe/Istanbul",
      backend: redisClient ? "redis" : "in-memory",
    },
    "Scheduler started",
  );
}
