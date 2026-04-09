/**
 * stays.ts — Domain helpers for guest stay dates and extension tracking.
 *
 * Pure functions only. No UI imports. Centralizes all date formatting,
 * night counting, extension derivation, and stay-status resolution so
 * nothing leaks into components.
 */

// ---------------------------------------------------------------------------
// Stay status
// ---------------------------------------------------------------------------

/**
 * The resolved access state of a guest's stay.
 *   active    — today is within the stay window (check-in ≤ today ≤ check-out)
 *   upcoming  — check-in is in the future (guest has not arrived yet)
 *   expired   — check-out day has passed (stay window is closed)
 *   no_dates  — no dates stored (backward-compat guests created before date schema)
 */
export type StayStatus = "active" | "upcoming" | "expired" | "no_dates";

/**
 * Resolve the stay status for a guest using local browser time.
 * (Matches the server's UTC-based `resolveStayStatus` for the same-day case
 * under reasonable timezone assumptions; close enough for UI presentation.)
 *
 * Checkout day is included in the active window.
 */
export function resolveStayStatus(
  checkInDate: string | null | undefined,
  checkOutDate: string | null | undefined
): StayStatus {
  if (!checkInDate && !checkOutDate) return "no_dates";
  const today = todayIso();
  if (checkInDate && today < checkInDate) return "upcoming";
  if (checkOutDate && today > checkOutDate) return "expired";
  return "active";
}

/**
 * Format a YYYY-MM-DD date string into a human-readable short form.
 * Uses local-time construction to avoid UTC-shift issues.
 *   "2025-04-09" → "Apr 9"
 */
export function formatStayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "–";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Return the number of nights between checkIn and checkOut.
 * Returns null if either date is missing.
 */
export function stayNights(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined
): number | null {
  if (!checkIn || !checkOut) return null;
  const [y1, m1, d1] = checkIn.split("-").map(Number);
  const [y2, m2, d2] = checkOut.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  const nights = Math.round((b - a) / 86_400_000);
  return nights > 0 ? nights : null;
}

/**
 * Return the number of days the stay was extended by.
 * (currentCheckOut - originalCheckOut)
 */
export function extensionDays(
  originalCheckOut: string | null | undefined,
  currentCheckOut: string | null | undefined
): number | null {
  if (!originalCheckOut || !currentCheckOut) return null;
  const [y1, m1, d1] = originalCheckOut.split("-").map(Number);
  const [y2, m2, d2] = currentCheckOut.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  const days = Math.round((b - a) / 86_400_000);
  return days > 0 ? days : null;
}

/**
 * Return today's date in YYYY-MM-DD format (local time).
 */
export function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Return the minimum allowed checkout date (day after checkIn, or tomorrow).
 */
export function minCheckOutDate(checkIn: string | null | undefined): string {
  const base = checkIn ?? todayIso();
  const [y, m, d] = base.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}
