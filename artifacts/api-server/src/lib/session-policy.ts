/**
 * Persistent session policy — single source of truth for guest/staff session TTL.
 *
 * Guests and hotel staff stay signed in until explicit logout.
 * Guest stay-window rules (check-in → check-out) are enforced separately on /auth/me and refresh.
 */

/** Sliding persistent session — renewed via POST /auth/refresh. */
export const PERSISTENT_SESSION_TTL_MS = 400 * 24 * 60 * 60 * 1000;

/** Platform admin keeps a shorter fixed window. */
export const PLATFORM_ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** Allow refresh of recently expired tokens (browser closed for a while). */
export const TOKEN_REFRESH_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

/** Client should refresh when less than this remains before exp. */
export const TOKEN_REFRESH_LEAD_MS = 7 * 24 * 60 * 60 * 1000;

const PERSISTENT_ROLES = new Set<string>(["manager", "personnel", "guest"]);
const PLATFORM_ADMIN_ROLE = "platform_admin";

export function isPersistentSessionRole(role: string): boolean {
  return PERSISTENT_ROLES.has(role);
}

export function sessionTtlForRole(role: string): number {
  if (role === PLATFORM_ADMIN_ROLE) {
    return PLATFORM_ADMIN_SESSION_TTL_MS;
  }
  return PERSISTENT_SESSION_TTL_MS;
}

export interface SessionTokenPayload {
  userId: number;
  role: string;
  hotelId: number;
  guestId?: number;
  staffDepartment?: string | null;
  iat: number;
  exp: number;
}

export function tokenExpiresWithin(exp: number, withinMs: number): boolean {
  return exp - Date.now() <= withinMs;
}

export function tokenWithinRefreshGrace(exp: number): boolean {
  return Date.now() <= exp + TOKEN_REFRESH_GRACE_MS;
}
