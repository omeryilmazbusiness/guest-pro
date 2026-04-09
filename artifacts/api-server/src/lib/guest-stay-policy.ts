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
 *
 * Date handling:
 *   The pg (node-postgres) driver returns JavaScript Date objects for Postgres
 *   DATE columns.  drizzle-orm's PgDateString.mapFromDriverValue converts them
 *   back to "YYYY-MM-DD" strings via .toISOString().slice(0, 10).
 *
 *   To be fully defensive against driver changes (or future mode:"date" columns),
 *   normalizeDate() accepts both strings and Date objects and always returns a
 *   canonical "YYYY-MM-DD" UTC string suitable for lexicographic comparison.
 */

export type StayStatus = "active" | "upcoming" | "expired" | "no_dates";

/**
 * The error code returned alongside a denial reason.
 *   stay_upcoming — stay has not started yet
 *   stay_expired  — stay has ended
 */
export type StayDenialCode = "stay_upcoming" | "stay_expired";

export interface StayWindow {
  checkInDate: string | Date | null | undefined;
  checkOutDate: string | Date | null | undefined;
}

// ---------------------------------------------------------------------------
// Date normalization — defensive helper
// ---------------------------------------------------------------------------

/**
 * Normalize any date representation to a "YYYY-MM-DD" UTC string.
 *
 * Accepts:
 *   - "YYYY-MM-DD"                   → returned as-is
 *   - ISO 8601 string with time part  → first 10 characters (UTC date)
 *   - JavaScript Date object          → UTC date via .toISOString()
 *   - null / undefined / empty        → null
 *
 * The function never relies on the runtime's local timezone, ensuring that
 * date comparisons are deterministic regardless of where the server runs.
 */
function normalizeDate(d: string | Date | null | undefined): string | null {
  if (!d) return null;
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }
  const s = d.trim();
  if (!s) return null;
  // Already YYYY-MM-DD or ISO with time — take the first 10 chars (UTC date portion)
  return s.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Today in YYYY-MM-DD (UTC)
// ---------------------------------------------------------------------------

/**
 * Today in YYYY-MM-DD format (UTC).
 * Postgres DATE columns are timezone-agnostic; UTC is the correct comparison
 * basis on the server so that the access window is consistent regardless of
 * the server's local timezone configuration.
 */
function todayUtc(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Core policy functions
// ---------------------------------------------------------------------------

/**
 * Resolve the stay status from stored dates.
 *
 * Rules:
 *   - no_dates  → both dates absent (backward-compat guests created before schema)
 *   - upcoming  → check-in is in the future (guest has not arrived yet)
 *   - expired   → check-out day has passed (guest's stay window is closed)
 *   - active    → within the stay window (check-in day ≤ today ≤ check-out day)
 *
 * The check-out day itself is included in the active window (guests retain
 * access through the end of their checkout day).
 *
 * Date comparison is safe as ISO-string lexicographic comparison for YYYY-MM-DD.
 * normalizeDate() ensures both operands are always in that canonical form.
 */
export function resolveStayStatus(window: StayWindow): StayStatus {
  const checkIn = normalizeDate(window.checkInDate);
  const checkOut = normalizeDate(window.checkOutDate);

  if (!checkIn && !checkOut) return "no_dates";

  const today = todayUtc();

  if (checkIn && today < checkIn) return "upcoming";
  if (checkOut && today > checkOut) return "expired";

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
 * Returns the machine-readable denial code if access is not allowed, or null
 * if access is permitted.
 *
 * Use this when you need to branch on the specific reason (e.g., to decide
 * whether a QR token should be preserved for later use or permanently burned).
 */
export function getStayDenialCode(window: StayWindow): StayDenialCode | null {
  const status = resolveStayStatus(window);
  if (status === "upcoming") return "stay_upcoming";
  if (status === "expired") return "stay_expired";
  return null;
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

/**
 * Combined helper: returns both the denial code and the guest-facing message,
 * or null if access is permitted.
 *
 * Used in the QR and key login routes so the route handler only resolves the
 * stay status once and gets all the information it needs in one call.
 */
export function evaluateStayAccess(
  window: StayWindow
): { code: StayDenialCode; message: string } | null {
  const code = getStayDenialCode(window);
  if (!code) return null;

  const message =
    code === "stay_upcoming"
      ? "Your access is not active yet. Please use the system starting from your check-in date."
      : "Your stay access has expired. Please contact reception if you need an extension.";

  return { code, message };
}
