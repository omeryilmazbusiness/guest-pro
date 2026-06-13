/** Remember Me — iOS wheel date/time helpers (local timezone). */

export const REMEMBER_ME_DAY_COUNT = 14;
export const REMEMBER_ME_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;
export type RememberMeMinute = (typeof REMEMBER_ME_MINUTES)[number];

export function getRememberMeDayKeys(): string[] {
  const keys: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < REMEMBER_ME_DAY_COUNT; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    keys.push(formatDayKey(d));
  }
  return keys;
}

export function formatDayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatRememberMeDayLabel(dayKey: string, locale: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date) + " · " +
      (locale.startsWith("tr") ? "Bugün" : "Today");
  }
  if (date.getTime() === tomorrow.getTime()) {
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date) + " · " +
      (locale.startsWith("tr") ? "Yarın" : "Tomorrow");
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getRememberMeHourOptions(): number[] {
  return Array.from({ length: 24 }, (_, h) => h);
}

export function snapRememberMeMinute(minute: number): RememberMeMinute {
  const idx = Math.round(minute / 5);
  const clamped = Math.max(0, Math.min(REMEMBER_ME_MINUTES.length - 1, idx));
  return REMEMBER_ME_MINUTES[clamped];
}

export function defaultRememberMeParts(): {
  dayKey: string;
  hour24: number;
  minute: RememberMeMinute;
} {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return {
    dayKey: formatDayKey(d),
    hour24: d.getHours(),
    minute: snapRememberMeMinute(d.getMinutes()),
  };
}

export function rememberMePartsToDate(
  dayKey: string,
  hour24: number,
  minute: RememberMeMinute,
): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y, m - 1, d, hour24, minute, 0, 0);
}

export function minRememberMeTimestampMs(): number {
  return Date.now() + 2 * 60 * 1000;
}
