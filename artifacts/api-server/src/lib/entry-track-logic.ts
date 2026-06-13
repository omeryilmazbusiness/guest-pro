/** Pure Remember Me / entry-track scheduling rules (no I/O). */

export const REMEMBER_ME_ACK_TIMEOUT_MS = 30 * 1000;

export const IN_HOTEL_STATUSES = new Set(["IN_HOTEL_AND_ON_WIFI", "IN_HOTEL_NOT_ON_WIFI"]);

export type EmergencySeverity = "critical" | "warning";

export function isRememberMeDue(expectedEntryAt: Date, now: Date): boolean {
  return expectedEntryAt.getTime() <= now.getTime();
}

export function shouldEscalateRememberMe(guestPromptedAt: Date, now: Date): boolean {
  return now.getTime() >= guestPromptedAt.getTime() + REMEMBER_ME_ACK_TIMEOUT_MS;
}

export function secondsUntilEscalation(guestPromptedAt: Date, now: Date): number {
  const remainingMs =
    guestPromptedAt.getTime() + REMEMBER_ME_ACK_TIMEOUT_MS - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function isGuestInHotel(status: string | undefined | null): boolean {
  return !!status && IN_HOTEL_STATUSES.has(status);
}

export function rememberMeClientEventId(scheduleId: number): string {
  return `entry-track:${scheduleId}`;
}
