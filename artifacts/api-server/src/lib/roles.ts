/**
 * Central role and permission definitions for Guest Pro.
 *
 * This is the single source of truth for all role/permission logic on the server.
 * Add new roles and permissions here — never scatter them across route files.
 */

// ---------------------------------------------------------------------------
// Role constants
// ---------------------------------------------------------------------------

/** All roles that belong to hotel staff (stored in usersTable). */
export const STAFF_ROLES = ["manager", "personnel"] as const;

/** Role assigned to hotel guests (stored in guestsTable, negative userId). */
export const GUEST_ROLE = "guest" as const;

/** All recognized roles across the system. */
export const ALL_ROLES = [...STAFF_ROLES, GUEST_ROLE] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type UserRole = (typeof ALL_ROLES)[number];

// ---------------------------------------------------------------------------
// Permission definitions
// ---------------------------------------------------------------------------

export const Permission = {
  /** View the guest list */
  VIEW_GUESTS: "view_guests",
  /** Create a new hotel guest */
  CREATE_GUEST: "create_guest",
  /** Configure hotel branding and settings */
  MANAGE_HOTEL: "manage_hotel",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ---------------------------------------------------------------------------
// Access policy matrix — the single source of truth for "who can do what"
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
    // MANAGE_HOTEL is NOT included — personnel cannot configure the hotel
  ],
};

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

/** Returns true if the given role is a recognized staff role. */
export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as ReadonlyArray<string>).includes(role);
}

/** Returns true if the given role has the requested permission. */
export function can(role: string, permission: Permission): boolean {
  if (!isStaffRole(role)) return false;
  return (ROLE_PERMISSIONS[role] as ReadonlyArray<Permission>).includes(permission);
}

/**
 * Token TTL in milliseconds by role.
 * Used in generateToken — personnel gets the same 12-hour window as managers.
 */
export const TOKEN_TTL_BY_ROLE: Record<string, number> = {
  manager: 12 * 60 * 60 * 1000,
  personnel: 12 * 60 * 60 * 1000,
  guest: 7 * 24 * 60 * 60 * 1000,
};
