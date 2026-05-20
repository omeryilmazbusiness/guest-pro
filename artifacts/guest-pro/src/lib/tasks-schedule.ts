/**
 * Pure schedule helpers for the manager tasks grid.
 */

import type { StaffTask, TaskAssignee } from "@/lib/tasks";
import { assigneeDisplayName } from "@/lib/tasks";
import type { StaffMember } from "@/lib/staff";

export const WORK_HOUR_START = 6;
export const WORK_HOUR_END = 22;

/** Pixel width of one hour column in schedule grids. */
export const HOUR_COLUMN_PX = 52;
/** Height of one task lane within a row. */
export const TASK_LANE_HEIGHT_PX = 30;
/** Minimum row height when no tasks. */
export const TASK_ROW_MIN_HEIGHT_PX = 44;

export type TasksViewMode = "day" | "week";

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Monday-start week containing `anchor`. */
export function startOfWeek(anchor: Date): Date {
  const d = startOfDay(anchor);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function getDayRangeISO(date: Date): { from: string; to: string } {
  return {
    from: startOfDay(date).toISOString(),
    to: endOfDay(date).toISOString(),
  };
}

export function getWeekRangeISO(anchor: Date): { from: string; to: string } {
  const weekStart = startOfWeek(anchor);
  const weekEnd = endOfDay(addDays(weekStart, 6));
  return { from: weekStart.toISOString(), to: weekEnd.toISOString() };
}

export function getHourSlots(): number[] {
  const slots: number[] = [];
  for (let h = WORK_HOUR_START; h <= WORK_HOUR_END; h++) slots.push(h);
  return slots;
}

export function formatHour(h: number, locale = "en"): string {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: undefined });
}

export function formatDayLabel(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

export function formatAnchorTitle(
  mode: TasksViewMode,
  anchor: Date,
  locale: string,
): string {
  if (mode === "day") {
    return anchor.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  const fmt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString(locale, fmt)} – ${end.toLocaleDateString(locale, { ...fmt, year: "numeric" })}`;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function taskOverlapsInterval(
  task: StaffTask,
  from: Date,
  to: Date,
): boolean {
  const start = new Date(task.scheduledStartAt).getTime();
  const end = new Date(task.scheduledEndAt).getTime();
  return start < to.getTime() && end > from.getTime();
}

export function taskOverlapsDay(task: StaffTask, day: Date): boolean {
  return taskOverlapsInterval(task, startOfDay(day), endOfDay(day));
}

export function getWeekDayIndex(task: StaffTask, weekStart: Date): number | null {
  const taskDay = startOfDay(new Date(task.scheduledStartAt));
  const start = startOfDay(weekStart);
  const diff = Math.round((taskDay.getTime() - start.getTime()) / 86_400_000);
  if (diff < 0 || diff > 6) return null;
  return diff;
}

export function taskInHourSlot(task: StaffTask, day: Date, hour: number): boolean {
  const slotStart = new Date(day);
  slotStart.setHours(hour, 0, 0, 0);
  const slotEnd = new Date(day);
  slotEnd.setHours(hour + 1, 0, 0, 0);
  return taskOverlapsInterval(task, slotStart, slotEnd);
}

export function getDayWindowStart(day: Date): Date {
  const d = new Date(day);
  d.setHours(WORK_HOUR_START, 0, 0, 0);
  return d;
}

/** Exclusive end of the visible day window (start of hour after WORK_HOUR_END). */
export function getDayWindowEnd(day: Date): Date {
  const d = new Date(day);
  d.setHours(WORK_HOUR_END + 1, 0, 0, 0);
  return d;
}

export function getDayWindowDurationMs(day: Date): number {
  return getDayWindowEnd(day).getTime() - getDayWindowStart(day).getTime();
}

export interface TaskBarGeometry {
  leftPct: number;
  widthPct: number;
}

/** Maps a task to horizontal position within the day timeline (0–100%). */
export function getTaskBarOnDay(task: StaffTask, day: Date): TaskBarGeometry | null {
  if (!taskOverlapsDay(task, day)) return null;

  const winStart = getDayWindowStart(day).getTime();
  const winEnd = getDayWindowEnd(day).getTime();
  const winMs = winEnd - winStart;

  const taskStart = Math.max(new Date(task.scheduledStartAt).getTime(), winStart);
  const taskEnd = Math.min(new Date(task.scheduledEndAt).getTime(), winEnd);
  if (taskEnd <= taskStart) return null;

  const leftPct = ((taskStart - winStart) / winMs) * 100;
  const widthPct = Math.max(((taskEnd - taskStart) / winMs) * 100, 0.8);

  return { leftPct, widthPct };
}

export interface DayTaskBarLayout {
  task: StaffTask;
  leftPct: number;
  widthPct: number;
  lane: number;
}

/** Assigns vertical lanes for overlapping tasks on the same row. */
export function layoutDayTaskBars(
  tasks: StaffTask[],
  day: Date,
): { bars: DayTaskBarLayout[]; laneCount: number } {
  const items = tasks
    .map((task) => {
      const geom = getTaskBarOnDay(task, day);
      return geom ? { task, ...geom } : null;
    })
    .filter((x): x is DayTaskBarLayout & { lane?: number } => x !== null)
    .sort((a, b) => a.leftPct - b.leftPct || a.widthPct - b.widthPct);

  const laneEnds: number[] = [];
  const bars: DayTaskBarLayout[] = [];

  for (const item of items) {
    let lane = laneEnds.findIndex((end) => end <= item.leftPct + 0.15);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = item.leftPct + item.widthPct;
    bars.push({ task: item.task, leftPct: item.leftPct, widthPct: item.widthPct, lane });
  }

  return { bars, laneCount: Math.max(1, laneEnds.length) };
}

export function formatTaskTimeRange(task: StaffTask, locale: string): string {
  const start = new Date(task.scheduledStartAt);
  const end = new Date(task.scheduledEndAt);
  const fmt: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${start.toLocaleTimeString(locale, fmt)} – ${end.toLocaleTimeString(locale, fmt)}`;
}

export function tasksOnDayForAssignee(
  tasks: StaffTask[],
  assigneeId: number,
  day: Date,
): StaffTask[] {
  return tasksForAssignee(tasks, assigneeId).filter((t) => taskOverlapsDay(t, day));
}

export function filterTasksBySearch(tasks: StaffTask[], query: string): StaffTask[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter((t) => {
    const hay = [
      t.title,
      t.description ?? "",
      assigneeDisplayName(t.assignee),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function getOverdueTasks(tasks: StaffTask[]): StaffTask[] {
  return tasks
    .filter((t) => t.isOverdue)
    .sort(
      (a, b) =>
        new Date(a.scheduledEndAt).getTime() - new Date(b.scheduledEndAt).getTime(),
    );
}

export function activeStaffForGrid(members: StaffMember[]): StaffMember[] {
  return members
    .filter((m) => m.isActive)
    .sort((a, b) => {
      const na = [a.firstName, a.lastName].filter(Boolean).join(" ");
      const nb = [b.firstName, b.lastName].filter(Boolean).join(" ");
      return na.localeCompare(nb);
    });
}

export function tasksForAssignee(tasks: StaffTask[], assigneeId: number): StaffTask[] {
  return tasks.filter((t) => t.assigneeUserId === assigneeId);
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function defaultCreateRange(anchor: Date): { start: string; end: string } {
  const start = new Date(anchor);
  start.setHours(9, 0, 0, 0);
  const end = new Date(anchor);
  end.setHours(10, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export type GridEmployee = {
  id: number;
  name: string;
};

export function staffToGridEmployees(members: StaffMember[]): GridEmployee[] {
  return activeStaffForGrid(members).map((m) => ({
    id: m.id,
    name: [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email,
  }));
}

export function assigneeToGridEmployee(a: TaskAssignee): GridEmployee {
  return { id: a.id, name: assigneeDisplayName(a) };
}
