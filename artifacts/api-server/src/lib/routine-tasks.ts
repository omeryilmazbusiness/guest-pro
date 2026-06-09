/**
 * routine-tasks.ts — daily materialization of recurring task templates.
 */

import { db, routineTasksTable, staffTasksTable } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTimeOfDay(value: string): { hours: number; minutes: number } | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function applyTimeToUtcDate(dateStr: string, timeStr: string): Date | null {
  const time = parseTimeOfDay(timeStr);
  if (!time) return null;
  const base = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) return null;
  base.setUTCHours(time.hours, time.minutes, 0, 0);
  return base;
}

export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function dayBoundsUtc(dateStr: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateStr}T00:00:00.000Z`),
    end: new Date(`${dateStr}T23:59:59.999Z`),
  };
}

/**
 * Creates staff_tasks rows for active routine templates that do not yet exist
 * for the given calendar day.
 */
export async function ensureDailyRoutineTasks(
  hotelId: number,
  dateStr: string,
): Promise<number> {
  const routines = await db
    .select()
    .from(routineTasksTable)
    .where(and(eq(routineTasksTable.hotelId, hotelId), eq(routineTasksTable.isActive, true)));

  if (routines.length === 0) return 0;

  const routineIds = routines.map((r) => r.id);
  const existing = await db
    .select({ routineTaskId: staffTasksTable.routineTaskId })
    .from(staffTasksTable)
    .where(
      and(
        eq(staffTasksTable.hotelId, hotelId),
        eq(staffTasksTable.sourceDate, dateStr),
        inArray(staffTasksTable.routineTaskId, routineIds),
      ),
    );

  const existingIds = new Set(
    existing.map((e) => e.routineTaskId).filter((id): id is number => id != null),
  );

  let created = 0;

  for (const routine of routines) {
    if (existingIds.has(routine.id)) continue;

    const scheduledStartAt = applyTimeToUtcDate(dateStr, routine.startTime);
    const scheduledEndAt = applyTimeToUtcDate(dateStr, routine.endTime);
    if (!scheduledStartAt || !scheduledEndAt || scheduledEndAt <= scheduledStartAt) continue;

    await db.insert(staffTasksTable).values({
      hotelId,
      assigneeUserId: routine.assigneeUserId,
      createdByUserId: routine.createdByUserId,
      title: routine.title,
      description: routine.description,
      scheduledStartAt,
      scheduledEndAt,
      status: "pending",
      routineTaskId: routine.id,
      sourceDate: dateStr,
    });

    created++;
  }

  return created;
}
