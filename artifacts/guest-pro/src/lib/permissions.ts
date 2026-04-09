/**
 * Central client-side permission definitions for Guest Pro.
 *
 * This mirrors the server-side roles.ts policy and is the single source of
 * truth for UI-level capability checks. It NEVER replaces server-side
 * authorization — the server always enforces access independently.
 *
 * Usage:
 *   const { user } = useAuth();
 *   if (can(user?.role, Permission.MANAGE_HOTEL)) { ... }
 */

// ---------------------------------------------------------------------------
// Role types
// ---------------------------------------------------------------------------

export type StaffRole = "manager" | "personnel";
export type GuestRole = "guest";
export type UserRole = StaffRole | GuestRole;

/** All roles that belong to hotel staff. */
export const STAFF_ROLES: ReadonlyArray<StaffRole> = ["manager", "personnel"];

/** Returns true if the role belongs to a staff member. */
export function isStaffRole(role: string | undefined): role is StaffRole {
  return role === "manager" || role === "personnel";
}

// ---------------------------------------------------------------------------
// Permission definitions
// ---------------------------------------------------------------------------

export const Permission = {
  /** View the hotel's guest list */
  VIEW_GUESTS: "view_guests",
  /** Create a new hotel guest and generate their key */
  CREATE_GUEST: "create_guest",
  /** Access hotel branding, settings, and admin controls */
  MANAGE_HOTEL: "manage_hotel",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ---------------------------------------------------------------------------
// Access policy — single source of truth for "who can do what" on the client
// ---------------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<StaffRole, ReadonlyArray<Permission>> = {
  manager: [
    Permission.VIEW_GUESTS,
    Permission.CREATE_GUEST,
    Permission.MANAGE_HOTEL,
  ],
  personnel: [
    Permission.VIEW_GUESTS,
    Permission.CREATE_GUEST,
    // MANAGE_HOTEL is excluded — personnel cannot configure the hotel
  ],
};

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

/**
 * Returns true if the user with the given role has the requested permission.
 *
 * This is intentionally a pure function — no hooks, no React context —
 * so it can be called in components, route guards, or render logic.
 */
export function can(
  role: string | undefined,
  permission: Permission
): boolean {
  if (!role || !isStaffRole(role)) return false;
  return (ROLE_PERMISSIONS[role] as ReadonlyArray<Permission>).includes(permission);
}

/**
 * Returns the display label for a staff role.
 */
export function roleLabel(role: string | undefined): string {
  if (role === "manager") return "Manager";
  if (role === "personnel") return "Staff";
  return "Staff";
}
