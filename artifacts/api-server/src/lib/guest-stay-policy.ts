/**
 * GuestStayPolicy — Centralized stay-window access rules.
 *
 * Single source of truth for guest access validation by stay dates.
 * No date comparisons are scattered in controllers, routes, or middleware.
 *
 * Architecture:
 *   - Pure functions only (no DB, no network)
 *   - Called from auth routes AFTER credential validation
 *   - Works with UTC dates (consistent with Postgres DATE columns)
 */

export type StayStatus = "active" | "upcoming" | "expired" | "no_dates";

export interface StayWindow {
  checkInDate: string | null | undefined;
  checkOutDate: string | null | undefined;
}

/**
 * Today in YYYY-MM-DD format (UTC).
 * Postgres DATE columns are timezone-agnostic; UTC is the correct comparison basis on the server.
 */
function todayUtc(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Resolve the stay status from stored dates.
 *
 * Rules:
 *   - no_dates  → both dates absent (backward-compat guests created before schema)
 *   - upcoming  → check-in is in the future (guest has not arrived yet)
 *   - expired   → check-out day has passed (guest's stay window is closed)
 *   - active    → within the stay window (check-in day ≤ today ≤ check-out day)
 *
 * The check-out day itself is included in the active window (guests retain access
 * through the end of their checkout day).
 *
 * Date comparison is safe as ISO string lexicographic comparison for YYYY-MM-DD.
 */
export function resolveStayStatus(window: StayWindow): StayStatus {
  const { checkInDate, checkOutDate } = window;

  if (!checkInDate && !checkOutDate) return "no_dates";

  const today = todayUtc();

  if (checkInDate && today < checkInDate) return "upcoming";
  if (checkOutDate && today > checkOutDate) return "expired";

  return "active";
}

/**
 * Returns true if the guest may access the system right now.
 *
 * Guests with no stay dates are allowed access for backward-compatibility with
 * guests created before the date schema was added.
 */
export function isStayAccessible(window: StayWindow): boolean {
  const status = resolveStayStatus(window);
  return status === "active" || status === "no_dates";
}

/**
 * Returns a professional, guest-facing denial message if access is not allowed.
 * Returns null if access is permitted.
 *
 * Messages are intentionally user-friendly and hospitality-appropriate.
 * They do not expose internal details about the data model or token state.
 */
export function getAccessDenialReason(window: StayWindow): string | null {
  const status = resolveStayStatus(window);

  if (status === "upcoming") {
    return "Your access is not active yet. Please use the system starting from your check-in date.";
  }

  if (status === "expired") {
    return "Your stay access has expired. Please contact reception if you need an extension.";
  }

  return null;
}
