/**
 * scheduler.ts
 * Daily summary auto-generation scheduler.
 * Runs a lightweight interval that triggers at 23:30 UTC for all hotels.
 * Idempotent — skips generation if a summary for today already exists.
 */

import { db, hotelsTable, dailySummariesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { buildAnalyticsSnapshot, todayRange, utcDateString } from "./request-analytics";
import { generateAISummary } from "./ai-summary";
import { logger } from "./logger";

const TRIGGER_HOUR_UTC = 23;
const TRIGGER_MINUTE_UTC = 30;

let lastTriggeredDate: string | null = null;

async function generateForAllHotels(): Promise<void> {
  const today = utcDateString();

  if (lastTriggeredDate === today) return;
  lastTriggeredDate = today;

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

export function startScheduler(): void {
  setInterval(() => {
    const now = new Date();
    if (
      now.getUTCHours() === TRIGGER_HOUR_UTC &&
      now.getUTCMinutes() === TRIGGER_MINUTE_UTC
    ) {
      generateForAllHotels().catch((err) =>
        logger.error({ err }, "Scheduler: unhandled error")
      );
    }
  }, 60_000);

  logger.info(
    { triggerHour: TRIGGER_HOUR_UTC, triggerMinute: TRIGGER_MINUTE_UTC },
    "Daily summary scheduler started"
  );
}
