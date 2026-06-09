/**
 * daily-task-insight.ts — once-daily task performance insight (18:00 Europe/Istanbul).
 * Lists are deterministic (zero tokens); optional one-sentence AI summary only.
 */

import { db, dailyTaskInsightsTable, hotelsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import type { StaffDepartment } from "./roles";
import { DEPARTMENT_MANAGER_DEPARTMENTS } from "./roles";
import { buildTaskPerformanceReport } from "./task-analytics";
import {
  buildDeterministicTaskInsight,
  generateCompactTaskInsightSummary,
  type TaskPerformanceInsightLocale,
} from "./ai-summary";
import { logger } from "./logger";

const INSIGHT_TIMEZONE = "Europe/Istanbul";

export function istanbulDateString(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: INSIGHT_TIMEZONE }).format(at);
}

export function istanbulDayRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00+03:00`);
  const end = new Date(`${dateStr}T23:59:59.999+03:00`);
  return { start, end };
}

export function isTaskInsightTriggerTime(at: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INSIGHT_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(at);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? -1);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? -1);
  return hour === 18 && minute === 0;
}

function deptScopeFromStorage(staffDepartment: string): StaffDepartment | null {
  if (!staffDepartment) return null;
  return staffDepartment as StaffDepartment;
}

function storageDepartment(dept: StaffDepartment | null): string {
  return dept ?? "";
}

export interface StoredDailyTaskInsight {
  id: number;
  hotelId: number;
  staffDepartment: string;
  date: string;
  summary: string;
  finishedOnTime: string[];
  finishedLate: string[];
  notFinished: string[];
  generatedAt: string;
}

function serializeRow(row: typeof dailyTaskInsightsTable.$inferSelect): StoredDailyTaskInsight {
  return {
    id: row.id,
    hotelId: row.hotelId,
    staffDepartment: row.staffDepartment,
    date: row.date,
    summary: row.summary,
    finishedOnTime: row.finishedOnTime,
    finishedLate: row.finishedLate,
    notFinished: row.notFinished,
    generatedAt: row.generatedAt.toISOString(),
  };
}

export async function getStoredDailyTaskInsight(
  hotelId: number,
  departmentScope: StaffDepartment | null,
  date: string,
): Promise<StoredDailyTaskInsight | null> {
  const [row] = await db
    .select()
    .from(dailyTaskInsightsTable)
    .where(
      and(
        eq(dailyTaskInsightsTable.hotelId, hotelId),
        eq(dailyTaskInsightsTable.staffDepartment, storageDepartment(departmentScope)),
        eq(dailyTaskInsightsTable.date, date),
      ),
    )
    .limit(1);

  return row ? serializeRow(row) : null;
}

export async function generateDailyTaskInsight(
  hotelId: number,
  departmentScope: StaffDepartment | null,
  date: string,
  locale: TaskPerformanceInsightLocale = "tr",
): Promise<StoredDailyTaskInsight | null> {
  const existing = await getStoredDailyTaskInsight(hotelId, departmentScope, date);
  if (existing) return existing;

  const { start, end } = istanbulDayRange(date);
  const report = await buildTaskPerformanceReport(hotelId, start, end, departmentScope);
  const deterministic = buildDeterministicTaskInsight(report, locale);

  if (report.totalTasks === 0) {
    return null;
  }

  let summary = deterministic.summary;
  try {
    const aiSummary = await generateCompactTaskInsightSummary(hotelId, deterministic, locale);
    if (aiSummary) summary = aiSummary;
  } catch (err) {
    logger.warn({ err, hotelId, date, departmentScope }, "Compact task insight AI skipped");
  }

  const [inserted] = await db
    .insert(dailyTaskInsightsTable)
    .values({
      hotelId,
      staffDepartment: storageDepartment(departmentScope),
      date,
      summary,
      finishedOnTime: deterministic.finishedOnTime,
      finishedLate: deterministic.finishedLate,
      notFinished: deterministic.notFinished,
    })
    .onConflictDoNothing({
      target: [
        dailyTaskInsightsTable.hotelId,
        dailyTaskInsightsTable.staffDepartment,
        dailyTaskInsightsTable.date,
      ],
    })
    .returning();

  if (inserted) return serializeRow(inserted);

  return getStoredDailyTaskInsight(hotelId, departmentScope, date);
}

export async function generateDailyTaskInsightsForHotel(
  hotelId: number,
  date: string,
  locale: TaskPerformanceInsightLocale = "tr",
): Promise<number> {
  let created = 0;

  const hotelWide = await generateDailyTaskInsight(hotelId, null, date, locale);
  if (hotelWide) created += 1;

  for (const dept of DEPARTMENT_MANAGER_DEPARTMENTS) {
    const row = await generateDailyTaskInsight(hotelId, dept, date, locale);
    if (row) created += 1;
  }

  return created;
}

export async function generateDailyTaskInsightsForAllHotels(date: string): Promise<void> {
  const hotels = await db.select({ id: hotelsTable.id }).from(hotelsTable);

  for (const hotel of hotels) {
    try {
      await generateDailyTaskInsightsForHotel(hotel.id, date, "tr");
      logger.info({ hotelId: hotel.id, date }, "Daily task insight generated");
    } catch (err) {
      logger.error({ err, hotelId: hotel.id, date }, "Failed to generate daily task insight");
    }
  }
}

export { deptScopeFromStorage, storageDepartment };
