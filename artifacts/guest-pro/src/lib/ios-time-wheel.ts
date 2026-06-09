/**
 * iOS-style time wheel helpers (07:00 – 23:45, 15-minute steps).
 */

import {
  DAILY_TIMELINE_END_HOUR,
  DAILY_TIMELINE_START_HOUR,
} from "@/lib/tasks-schedule";

export const WHEEL_MINUTE_STEPS = [0, 15, 30, 45] as const;
export type WheelPeriod = "AM" | "PM";
export type WheelMinute = (typeof WHEEL_MINUTE_STEPS)[number];

export const WHEEL_HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

const MIN_MINUTES = DAILY_TIMELINE_START_HOUR * 60;
const MAX_MINUTES = (DAILY_TIMELINE_END_HOUR - 1) * 60 + 45;

export function localeUses12Hour(locale: string): boolean {
  return (
    new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12 ??
    true
  );
}

export function to24Hour(hour12: number, period: WheelPeriod): number {
  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function from24Hour(hour24: number): { hour12: number; period: WheelPeriod } {
  if (hour24 === 0) return { hour12: 12, period: "AM" };
  if (hour24 < 12) return { hour12: hour24, period: "AM" };
  if (hour24 === 12) return { hour12: 12, period: "PM" };
  return { hour12: hour24 - 12, period: "PM" };
}

export function snapMinute(minute: number): WheelMinute {
  const idx = Math.round(minute / 15);
  const clamped = Math.max(0, Math.min(3, idx));
  return WHEEL_MINUTE_STEPS[clamped];
}

export function timeToMinutes(hour24: number, minute: number): number {
  return hour24 * 60 + minute;
}

export function minutesToParts(totalMinutes: number): { hour24: number; minute: WheelMinute } {
  const clamped = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, totalMinutes));
  const hour24 = Math.floor(clamped / 60);
  const minute = snapMinute(clamped % 60);
  return { hour24, minute };
}

export function clampScheduleTime(
  hour24: number,
  minute: number,
): { hour24: number; minute: WheelMinute } {
  return minutesToParts(timeToMinutes(hour24, snapMinute(minute)));
}

export function parseTimeFromDatetimeLocal(value: string): {
  hour24: number;
  minute: WheelMinute;
} {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return clampScheduleTime(DAILY_TIMELINE_START_HOUR, 0);
  }
  return clampScheduleTime(d.getHours(), d.getMinutes());
}

export function isValidScheduleRange(startMin: number, endMin: number): boolean {
  return endMin > startMin && startMin >= MIN_MINUTES && endMin <= MAX_MINUTES;
}

export function minEndMinutes(startMin: number): number {
  return Math.min(startMin + 15, MAX_MINUTES);
}

export function formatWheelMinute(minute: WheelMinute): string {
  return String(minute).padStart(2, "0");
}

export function formatWheelHour12(hour12: number): string {
  return String(hour12);
}

export function formatWheelPeriod(period: WheelPeriod, locale: string): string {
  const d = new Date();
  d.setHours(period === "AM" ? 9 : 21, 0, 0, 0);
  return (
    new Intl.DateTimeFormat(locale, { hour: "numeric" })
      .formatToParts(d)
      .find((p) => p.type === "dayPeriod")?.value ?? (period === "AM" ? "AM" : "PM")
  );
}

/** 24h wheel labels (for locales without 12h). */
export function formatWheelHour24(hour24: number): string {
  return String(hour24).padStart(2, "0");
}

export function getWheelHour24Options(): number[] {
  const hours: number[] = [];
  for (let h = DAILY_TIMELINE_START_HOUR; h < DAILY_TIMELINE_END_HOUR; h++) {
    hours.push(h);
  }
  return hours;
}
