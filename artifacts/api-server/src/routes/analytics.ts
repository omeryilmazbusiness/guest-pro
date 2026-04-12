/**
 * analytics.ts routes
 * Manager-only endpoints for live quick reports and stored daily summaries.
 *
 * GET  /api/analytics/quick-report         — live on-demand analytics + AI
 * GET  /api/analytics/daily-summaries      — list stored daily summaries for hotel
 * POST /api/analytics/daily-summaries/generate — trigger summary for today (or date param)
 */

import { Router } from "express";
import type { IRouter } from "express";
import { db, dailySummariesTable, hotelsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireManager } from "../middlewares/requireAuth";
import { buildAnalyticsSnapshot, todayRange, utcDateString } from "../lib/request-analytics";
import { generateAISummary, generateQuickReportAI } from "../lib/ai-summary";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// GET /analytics/quick-report — live on-demand snapshot for today
// ---------------------------------------------------------------------------
router.get("/analytics/quick-report", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;

  const { start, end } = todayRange();

  const snapshot = await buildAnalyticsSnapshot(hotelId, start, end);
  const ai = await generateQuickReportAI(snapshot);

  res.json({
    ...snapshot,
    summary: ai.summary,
    complaintAnalysis: ai.complaintAnalysis,
    timingInsights: ai.timingInsights,
    recommendations: ai.recommendations,
  });
});

// ---------------------------------------------------------------------------
// GET /analytics/daily-summaries — list stored summaries for hotel
// ---------------------------------------------------------------------------
router.get("/analytics/daily-summaries", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;

  const summaries = await db
    .select()
    .from(dailySummariesTable)
    .where(eq(dailySummariesTable.hotelId, hotelId))
    .orderBy(desc(dailySummariesTable.date))
    .limit(30);

  res.json(summaries);
});

// ---------------------------------------------------------------------------
// POST /analytics/daily-summaries/generate — manually trigger for today
// ---------------------------------------------------------------------------
router.post("/analytics/daily-summaries/generate", requireManager, async (req, res): Promise<void> => {
  const hotelId = req.session!.hotelId;
  const date = typeof req.body.date === "string" ? req.body.date : utcDateString();

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  if (isNaN(dayStart.getTime())) {
    res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
    return;
  }

  const snapshot = await buildAnalyticsSnapshot(hotelId, dayStart, dayEnd);
  const { insights, recommendations } = await generateAISummary(snapshot);

  const [hotel] = await db.select({ id: hotelsTable.id }).from(hotelsTable).where(eq(hotelsTable.id, hotelId)).limit(1);
  if (!hotel) {
    res.status(404).json({ error: "Hotel not found" });
    return;
  }

  const existing = await db
    .select({ id: dailySummariesTable.id })
    .from(dailySummariesTable)
    .where(and(eq(dailySummariesTable.hotelId, hotelId), eq(dailySummariesTable.date, date)))
    .limit(1);

  let result;
  if (existing.length > 0) {
    [result] = await db
      .update(dailySummariesTable)
      .set({ insights, recommendations, metricsSnapshot: snapshot as unknown as Record<string, unknown> })
      .where(and(eq(dailySummariesTable.hotelId, hotelId), eq(dailySummariesTable.date, date)))
      .returning();
  } else {
    [result] = await db
      .insert(dailySummariesTable)
      .values({
        hotelId,
        date,
        insights,
        recommendations,
        metricsSnapshot: snapshot as unknown as Record<string, unknown>,
      })
      .returning();
  }

  logger.info({ hotelId, date }, "Daily summary manually generated");
  res.status(200).json(result);
});

export default router;
