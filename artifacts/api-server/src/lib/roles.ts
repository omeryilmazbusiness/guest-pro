import { sessionTtlForRole } from "./session-policy";

/**
 * Central role and permission definitions for Guest Pro.
 *
 * This is the single source of truth for all role/permission logic on the server.
 * Add new roles and permissions here — never scatter them across route files.
 */

// ---------------------------------------------------------------------------
// Role constants
// ---------------------------------------------------------------------------

/** Platform super-admin (stored in platformAdminsTable). */
export const PLATFORM_ADMIN_ROLE = "platform_admin" as const;

/** JWT sentinel when no hotel is bound (platform operators only). */
export const PLATFORM_HOTEL_ID = 0;

/** All roles that belong to hotel staff (stored in usersTable). */
export const STAFF_ROLES = ["manager", "personnel"] as const;

/** Role assigned to hotel guests (stored in guestsTable, negative userId). */
export const GUEST_ROLE = "guest" as const;

/** All recognized roles across the system. */
export const ALL_ROLES = [PLATFORM_ADMIN_ROLE, ...STAFF_ROLES, GUEST_ROLE] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type PlatformAdminRole = typeof PLATFORM_ADMIN_ROLE;
export type UserRole = (typeof ALL_ROLES)[number];

export function isPlatformAdminRole(role: string): role is PlatformAdminRole {
  return role === PLATFORM_ADMIN_ROLE;
}

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
  "KITCHEN",
  "FINANCIAL_ACCOUNTING",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "SPA_GYM",
] as const;

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  HOUSEKEEPING: "Housekeeping",
  BELLMAN: "Bellman",
  RECEPTION: "Reception",
  RESTAURANT: "Restaurant",
  KITCHEN: "Kitchen",
  FINANCIAL_ACCOUNTING: "Financial & Accounting",
  SECURITY: "Security",
  MAINTENANCE: "Maintenance",
  MARKETING: "Marketing",
  SPA_GYM: "Spa & Gym",
};

/** Departments eligible for department-manager scope. */
export const DEPARTMENT_MANAGER_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "RECEPTION",
  "KITCHEN",
  "FINANCIAL_ACCOUNTING",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "SPA_GYM",
] as const satisfies readonly StaffDepartment[];

export type DepartmentManagerDepartment = (typeof DEPARTMENT_MANAGER_DEPARTMENTS)[number];

/** Personnel who sign in with a 4-digit employee number (staff portal). */
export const EMPLOYEE_NUMBER_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "KITCHEN",
  "FINANCIAL_ACCOUNTING",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "SPA_GYM",
] as const satisfies readonly StaffDepartment[];

/** Reception / restaurant personnel — email + password, not employee numbers. */
export const EMAIL_LOGIN_PERSONNEL_DEPARTMENTS = ["RECEPTION", "RESTAURANT"] as const satisfies readonly StaffDepartment[];

export type EmailLoginPersonnelDepartment = (typeof EMAIL_LOGIN_PERSONNEL_DEPARTMENTS)[number];

export function isEmailLoginPersonnelDepartment(
  dept: string | null | undefined,
): dept is EmailLoginPersonnelDepartment {
  return (
    dept != null &&
    (EMAIL_LOGIN_PERSONNEL_DEPARTMENTS as readonly string[]).includes(dept)
  );
}

export function isEmployeeNumberDepartment(
  dept: string | null | undefined,
): dept is Exclude<StaffDepartment, EmailLoginPersonnelDepartment> {
  return (
    dept != null &&
    (EMPLOYEE_NUMBER_DEPARTMENTS as readonly string[]).includes(dept)
  );
}

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
 * Guest and hotel staff use persistent sliding sessions (refreshed via POST /auth/refresh).
 */
export const TOKEN_TTL_BY_ROLE: Record<string, number> = {
  [PLATFORM_ADMIN_ROLE]: sessionTtlForRole(PLATFORM_ADMIN_ROLE),
  manager: sessionTtlForRole("manager"),
  personnel: sessionTtlForRole("personnel"),
  guest: sessionTtlForRole(GUEST_ROLE),
};
