/**
 * analytics.ts routes — stored daily insights + task metrics (no live AI on page load).
 */

import { Router } from "express";
import type { IRouter } from "express";
import { db, dailySummariesTable, hotelsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireManager, requireStaffManager } from "../middlewares/requireAuth";
import { getDepartmentScope } from "../lib/staff-scope";
import { buildAnalyticsSnapshot, todayRange, utcDateString } from "../lib/request-analytics";
import { buildTaskPerformanceReport } from "../lib/task-analytics";
import { type TaskPerformanceInsightLocale } from "../lib/ai-summary";
import {
  generateDailyTaskInsight,
  getStoredDailyTaskInsight,
  istanbulDateString,
} from "../lib/daily-task-insight";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TASK_INSIGHT_LOCALES = new Set<TaskPerformanceInsightLocale>(["en", "tr", "ar"]);

function parseInsightLocale(raw: unknown): TaskPerformanceInsightLocale {
  if (typeof raw === "string" && TASK_INSIGHT_LOCALES.has(raw as TaskPerformanceInsightLocale)) {
    return raw as TaskPerformanceInsightLocale;
  }
  return "tr";
}

function attachStoredInsight(
  report: Awaited<ReturnType<typeof buildTaskPerformanceReport>>,
  stored: Awaited<ReturnType<typeof getStoredDailyTaskInsight>>,
  locale: TaskPerformanceInsightLocale,
) {
  if (stored) {
    return {
      aiSummary: stored.summary,
      aiFinishedOnTime: stored.finishedOnTime,
      aiFinishedLate: stored.finishedLate,
      aiNotFinished: stored.notFinished,
      aiEmployeeNotes: [
        ...stored.finishedOnTime,
        ...stored.finishedLate,
        ...stored.notFinished,
      ],
      insightId: stored.id,
      insightGeneratedAt: stored.generatedAt,
      insightPending: false,
      aiBudgetLimited: false,
    };
  }

  const pendingMsg =
    locale === "tr"
      ? "Günlük AI raporu akşam 18:00'de oluşturulur."
      : locale === "ar"
        ? "يتم إنشاء تقرير AI اليومي الساعة 6:00 مساءً."
        : "Daily AI report is generated at 6:00 PM.";

  return {
    aiSummary: pendingMsg,
    aiFinishedOnTime: [] as string[],
    aiFinishedLate: [] as string[],
    aiNotFinished: [] as string[],
    aiEmployeeNotes: [] as string[],
    insightId: null as number | null,
    insightGeneratedAt: null as string | null,
    insightPending: true,
    aiBudgetLimited: false,
  };
}

// ---------------------------------------------------------------------------
// GET /analytics/daily-task-insight — stored end-of-day report (scope-aware)
// ---------------------------------------------------------------------------
router.get("/analytics/daily-task-insight", requireStaffManager, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const date =
    typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : istanbulDateString();

  const deptScope = getDepartmentScope({
    role: session.role,
    staffDepartment: session.staffDepartment,
  });

  const stored = await getStoredDailyTaskInsight(hotelId, deptScope, date);
  res.json(stored);
});

// ---------------------------------------------------------------------------
// GET /analytics/tasks-report — task metrics + cached daily insight (no live AI)
// ---------------------------------------------------------------------------
router.get("/analytics/tasks-report", requireStaffManager, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const fromParam = typeof req.query.from === "string" ? req.query.from : undefined;
  const toParam = typeof req.query.to === "string" ? req.query.to : undefined;
  const locale = parseInsightLocale(req.query.locale);

  let start: Date;
  let end: Date;
  if (fromParam && toParam) {
    start = new Date(fromParam);
    end = new Date(toParam);
  } else {
    ({ start, end } = todayRange());
  }

  const insightDate = fromParam ? istanbulDateString(new Date(fromParam)) : istanbulDateString();

  const deptScope = getDepartmentScope({
    role: session.role,
    staffDepartment: session.staffDepartment,
  });

  try {
    const report = await buildTaskPerformanceReport(hotelId, start, end, deptScope);
    const stored = await getStoredDailyTaskInsight(hotelId, deptScope, insightDate);
    const insight = attachStoredInsight(report, stored, locale);

    res.json({
      ...report,
      ...insight,
    });
  } catch (err) {
    logger.error({ err, hotelId }, "Task performance report failed");
    res.status(500).json({ error: "Failed to build task performance report" });
  }
});

// ---------------------------------------------------------------------------
// POST /analytics/daily-task-insight/generate — manual trigger (dev / admin testing)
// ---------------------------------------------------------------------------
router.post("/analytics/daily-task-insight/generate", requireStaffManager, async (req, res): Promise<void> => {
  const session = req.session!;
  const hotelId = session.hotelId;
  const locale = parseInsightLocale(req.body?.locale);
  const date =
    typeof req.body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)
      ? req.body.date
      : istanbulDateString();

  const deptScope = getDepartmentScope({
    role: session.role,
    staffDepartment: session.staffDepartment,
  });

  const row = await generateDailyTaskInsight(hotelId, deptScope, date, locale);
  if (!row) {
    res.status(200).json({ message: "No tasks for this period", insight: null });
    return;
  }
  res.status(200).json(row);
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
  const { generateAISummary } = await import("../lib/ai-summary");
  const aiResult = await generateAISummary(hotelId, snapshot);
  const { insights, recommendations } = aiResult;

  const [hotel] = await db
    .select({ id: hotelsTable.id })
    .from(hotelsTable)
    .where(eq(hotelsTable.id, hotelId))
    .limit(1);
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
      .set({
        insights,
        recommendations,
        metricsSnapshot: snapshot as unknown as Record<string, unknown>,
      })
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
  res.status(200).json({ ...result, aiUsage: aiResult.aiUsage, aiBudgetLimited: aiResult.aiBudgetLimited });
});

export default router;
