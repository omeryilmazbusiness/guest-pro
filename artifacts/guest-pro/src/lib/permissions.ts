/**
 * Central client-side permission definitions for Guest Pro.
 *
 * This mirrors the server-side roles.ts policy and is the single source of
 * truth for UI-level capability checks. It NEVER replaces server-side
 * authorization — the server always enforces access independently.
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
  /** Edit an existing guest's details */
  EDIT_GUEST: "edit_guest",
  /** Delete a guest (soft-delete; manager only) */
  DELETE_GUEST: "delete_guest",
  /** Renew a guest's access key and QR token */
  RENEW_GUEST_KEY: "renew_guest_key",
  /** Access hotel branding, settings, and admin controls */
  MANAGE_HOTEL: "manage_hotel",
  /** Create, edit, and deactivate staff members (manager only) */
  MANAGE_STAFF: "manage_staff",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ---------------------------------------------------------------------------
// Access policy — single source of truth for "who can do what" on the client
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
    // DELETE_GUEST excluded — personnel cannot delete guests
    // MANAGE_HOTEL excluded — personnel cannot configure the hotel
    // MANAGE_STAFF excluded — only managers manage the team
  ],
};

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

/**
 * Returns true if the user with the given role has the requested permission.
 * Pure function — no hooks, no React context.
 */
export function can(role: string | undefined, permission: Permission): boolean {
  if (!role || !isStaffRole(role)) return false;
  return (ROLE_PERMISSIONS[role] as ReadonlyArray<Permission>).includes(permission);
}

/** Returns the display label for a staff role. */
export function roleLabel(role: string | undefined): string {
  if (role === "manager") return "Manager";
  if (role === "personnel") return "Staff";
  return "Staff";
}
