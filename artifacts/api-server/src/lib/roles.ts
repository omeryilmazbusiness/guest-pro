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
// Staff department classification
//
// Secondary classification for "personnel" users.
// Managers have staffDepartment = null.
// Future use: filter requests and screens by department.
// ---------------------------------------------------------------------------

export const STAFF_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "RECEPTION",
  "RESTAURANT",
] as const;

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  HOUSEKEEPING: "Housekeeping",
  BELLMAN:      "Bellman",
  RECEPTION:    "Reception",
  RESTAURANT:   "Restaurant",
};

// ---------------------------------------------------------------------------
// Permission definitions
// ---------------------------------------------------------------------------

export const Permission = {
  /** View the guest list */
  VIEW_GUESTS: "view_guests",
  /** Create a new hotel guest */
  CREATE_GUEST: "create_guest",
  /** Edit an existing guest's details */
  EDIT_GUEST: "edit_guest",
  /** Delete a guest (soft-delete) */
  DELETE_GUEST: "delete_guest",
  /** Renew a guest's access key and QR token */
  RENEW_GUEST_KEY: "renew_guest_key",
  /** Configure hotel branding and settings */
  MANAGE_HOTEL: "manage_hotel",
  /** Create, edit, and deactivate staff members (manager-only) */
  MANAGE_STAFF: "manage_staff",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ---------------------------------------------------------------------------
// Access policy matrix — the single source of truth for "who can do what"
// ---------------------------------------------------------------------------

const ROLE_PERMISSIONS: Record<StaffRole, ReadonlyArray<Permission>> = {
  manager: [
    Permission.VIEW_GUESTS,
    Permission.CREATE_GUEST,
    Permission.EDIT_GUEST,
    Permission.DELETE_GUEST,
    Permission.RENEW_GUEST_KEY,
    Permission.MANAGE_HOTEL,
    Permission.MANAGE_STAFF,
  ],
  personnel: [
    Permission.VIEW_GUESTS,
    Permission.CREATE_GUEST,
    Permission.EDIT_GUEST,
    Permission.RENEW_GUEST_KEY,
    // DELETE_GUEST is NOT included — personnel cannot delete guests
    // MANAGE_HOTEL is NOT included — personnel cannot configure the hotel
    // MANAGE_STAFF is NOT included — only managers manage the team
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

/** Returns true if the given department value is valid. */
export function isValidDepartment(dept: unknown): dept is StaffDepartment {
  return (STAFF_DEPARTMENTS as ReadonlyArray<unknown>).includes(dept);
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
