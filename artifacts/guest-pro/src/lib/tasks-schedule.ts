/**
 * Pure schedule helpers for the manager tasks grid.
 */

import type { StaffTask, TaskAssignee } from "@/lib/tasks";
import { assigneeDisplayName } from "@/lib/tasks";
import type { StaffMember } from "@/lib/staff";

export const WORK_HOUR_START = 6;
export const WORK_HOUR_END = 22;

/** Daily timeline: one-hour columns from 07:00 through 11:59 PM (17 slots). */
export const DAILY_TIMELINE_START_HOUR = 7;
export const DAILY_TIMELINE_END_HOUR = 24;
export const DAILY_TIMELINE_SLOT_COUNT =
  DAILY_TIMELINE_END_HOUR - DAILY_TIMELINE_START_HOUR;
export const DAILY_TIMELINE_COLUMN_PX = 46;

/** Half-hour start slots for task create/edit (07:00–23:30). */
export const TASK_SCHEDULE_DURATION_MINUTES = [30, 60, 90, 120, 180] as const;
export const DAILY_TIMELINE_LANE_HEIGHT_PX = 28;
export const DAILY_TIMELINE_ROW_PAD_PX = 8;

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
export function getDailyTimelineHours(): number[] {
  return Array.from(
    { length: DAILY_TIMELINE_SLOT_COUNT },
    (_, i) => DAILY_TIMELINE_START_HOUR + i,
  );
}

export function formatHourSlotHeader(hour: number, locale = "en"): string {
  const { hour: h, period } = formatHourColumnLabel(hour, locale);
  return period ? `${h} ${period}` : h;
}

export function formatHourColumnLabel(
  hour: number,
  locale = "en",
): { hour: string; period: string } {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: true,
  }).formatToParts(d);
  const hourPart = parts.find((p) => p.type === "hour")?.value ?? String(hour);
  const period = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  return { hour: hourPart, period };
}

export function getTaskScheduleStartSlots(): { hour: number; minute: number }[] {
  const slots: { hour: number; minute: number }[] = [];
  for (let h = DAILY_TIMELINE_START_HOUR; h < DAILY_TIMELINE_END_HOUR; h++) {
    slots.push({ hour: h, minute: 0 }, { hour: h, minute: 30 });
  }
  return slots;
}

export function splitDatetimeLocal(value: string): {
  date: Date;
  hour: number;
  minute: number;
} | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return { date: startOfDay(d), hour: d.getHours(), minute: d.getMinutes() };
}

export function mergeDatetimeLocal(date: Date, hour: number, minute: number): string {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return toDatetimeLocalValue(d.toISOString());
}

export function durationMinutesBetween(startValue: string, endValue: string): number {
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 60;
  return Math.round((end - start) / 60_000);
}

export function addMinutesToDatetimeLocal(startValue: string, minutes: number): string {
  const d = new Date(startValue);
  d.setMinutes(d.getMinutes() + minutes);
  return toDatetimeLocalValue(d.toISOString());
}

export function formatScheduleDateLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatScheduleTimeLabel(isoOrLocal: string, locale: string): string {
  const d = new Date(isoOrLocal);
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

export function formatScheduleTimeSlot(hour: number, minute: number, locale: string): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

export function getDailyTimelineStart(day: Date): Date {
  const d = new Date(day);
  d.setHours(DAILY_TIMELINE_START_HOUR, 0, 0, 0);
  return d;
}

export function getDailyTimelineEnd(day: Date): Date {
  const d = new Date(day);
  d.setHours(DAILY_TIMELINE_END_HOUR, 0, 0, 0);
  return d;
}

/** Maps a task to horizontal position within the daily timeline (0–100%). */
export function getTaskBarInDailyTimeline(
  task: StaffTask,
  day: Date,
): TaskBarGeometry | null {
  if (!taskOverlapsDay(task, day)) return null;

  const winStart = getDailyTimelineStart(day).getTime();
  const winEnd = getDailyTimelineEnd(day).getTime();
  const winMs = winEnd - winStart;

  const taskStart = Math.max(new Date(task.scheduledStartAt).getTime(), winStart);
  const taskEnd = Math.min(new Date(task.scheduledEndAt).getTime(), winEnd);
  if (taskEnd <= taskStart) return null;

  const leftPct = ((taskStart - winStart) / winMs) * 100;
  const widthPct = ((taskEnd - taskStart) / winMs) * 100;
  if (widthPct < 0.15) return null;

  return { leftPct, widthPct: Math.max(widthPct, 0.4) };
}

/** Lane layout for tasks on one employee row inside the daily timeline. */
export function layoutTasksInDailyTimeline(
  tasks: StaffTask[],
  day: Date,
): { bars: DayTaskBarLayout[]; laneCount: number } {
  const items = sortTasksByStart(tasks)
    .map((task) => {
      const geom = getTaskBarInDailyTimeline(task, day);
      return geom ? { task, ...geom } : null;
    })
    .filter((x): x is DayTaskBarLayout & { lane?: number } => x !== null)
    .sort((a, b) => a.leftPct - b.leftPct || a.widthPct - b.widthPct);

  const laneEnds: number[] = [];
  const bars: DayTaskBarLayout[] = [];

  for (const item of items) {
    let lane = laneEnds.findIndex((end) => end <= item.leftPct + 0.5);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = item.leftPct + item.widthPct;
    bars.push({ task: item.task, leftPct: item.leftPct, widthPct: item.widthPct, lane });
  }

  return { bars, laneCount: Math.max(1, laneEnds.length) };
}

export function dailyTimelineRowHeight(laneCount: number): number {
  return Math.max(
    44,
    laneCount * DAILY_TIMELINE_LANE_HEIGHT_PX + DAILY_TIMELINE_ROW_PAD_PX * 2,
  );
}

/** Maps a task to horizontal position within the full day window (0–100%). */
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

export function filterTasksByStatus(
  tasks: StaffTask[],
  filter: TaskStatusFilter,
): StaffTask[] {
  if (filter === "all") {
    return tasks.filter((t) => t.status !== "cancelled");
  }
  if (filter === "overdue") {
    return tasks.filter(
      (t) => t.isOverdue && t.status !== "completed" && t.status !== "cancelled",
    );
  }
  return tasks.filter((t) => t.status === filter);
}

export type TaskStatusFilter = "all" | "pending" | "in_progress" | "completed" | "overdue";

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

export function sortTasksByStart(tasks: StaffTask[]): StaffTask[] {
  return [...tasks].sort(
    (a, b) =>
      new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime(),
  );
}

export function tasksForDay(tasks: StaffTask[], day: Date): StaffTask[] {
  return sortTasksByStart(tasks.filter((t) => taskOverlapsDay(t, day)));
}

export interface HourAssignmentEntry {
  taskId: number;
  taskTitle: string;
  assigneeName: string;
}

/** Per-hour list of active task ↔ assignee pairs for the assignment summary row. */
export function buildHourAssignmentMap(
  tasks: StaffTask[],
  day: Date,
): Map<number, HourAssignmentEntry[]> {
  const hours = getDailyTimelineHours();
  const map = new Map<number, HourAssignmentEntry[]>();
  for (const h of hours) {
    map.set(h, []);
  }

  const winStart = getDailyTimelineStart(day).getTime();
  const winEnd = getDailyTimelineEnd(day).getTime();

  for (const task of tasksForDay(tasks, day)) {
    if (task.status === "cancelled") continue;

    const taskStart = Math.max(new Date(task.scheduledStartAt).getTime(), winStart);
    const taskEnd = Math.min(new Date(task.scheduledEndAt).getTime(), winEnd);
    if (taskEnd <= taskStart) continue;

    const assigneeName = assigneeDisplayName(task.assignee);
    const entry: HourAssignmentEntry = {
      taskId: task.id,
      taskTitle: task.title,
      assigneeName,
    };

    for (const h of hours) {
      const slotStart = new Date(day);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(day);
      slotEnd.setHours(h === hours[hours.length - 1] ? 24 : h + 1, 0, 0, 0);

      if (taskStart < slotEnd.getTime() && taskEnd > slotStart.getTime()) {
        map.get(h)!.push(entry);
      }
    }
  }

  return map;
}

export function groupTasksByWeekDay(
  tasks: StaffTask[],
  weekStart: Date,
): { day: Date; tasks: StaffTask[] }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return { day, tasks: tasksForDay(tasks, day) };
  });
}

export function formatDayHeading(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function isToday(d: Date): boolean {
  return isSameCalendarDay(d, new Date());
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
  start.setHours(DAILY_TIMELINE_START_HOUR, 0, 0, 0);
  const end = new Date(anchor);
  end.setHours(DAILY_TIMELINE_START_HOUR + 1, 0, 0, 0);
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
