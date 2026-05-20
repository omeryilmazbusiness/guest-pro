/**
 * Central client-side permission definitions for Guest Pro.
 *
 * Scope-aware: pass { role, staffDepartment } for accurate checks when
 * department managers or reception staff differ from legacy role-only rules.
 */

import {
  resolveStaffScope,
  canAccessGuestOperations as scopeCanGuests,
  canManageStaff as scopeCanManageStaff,
  isGeneralManager as scopeIsGeneralManager,
  type StaffActor,
} from "@/lib/staff-scope";

// ---------------------------------------------------------------------------
// Role types
// ---------------------------------------------------------------------------

export type StaffRole = "manager" | "personnel";
export type GuestRole = "guest";
export type UserRole = StaffRole | GuestRole;

export const STAFF_ROLES: ReadonlyArray<StaffRole> = ["manager", "personnel"];

export function isStaffRole(role: string | undefined): role is StaffRole {
  return role === "manager" || role === "personnel";
}

function toActor(roleOrActor: string | StaffActor | undefined): StaffActor | null {
  if (!roleOrActor) return null;
  if (typeof roleOrActor === "string") return { role: roleOrActor };
  return roleOrActor;
}

// ---------------------------------------------------------------------------
// Permission definitions
// ---------------------------------------------------------------------------

export const Permission = {
  VIEW_GUESTS: "view_guests",
  CREATE_GUEST: "create_guest",
  EDIT_GUEST: "edit_guest",
  DELETE_GUEST: "delete_guest",
  RENEW_GUEST_KEY: "renew_guest_key",
  MANAGE_HOTEL: "manage_hotel",
  MANAGE_STAFF: "manage_staff",
  VIEW_TASKS: "view_tasks",
  MANAGE_TASKS: "manage_tasks",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------

export function can(
  roleOrActor: string | StaffActor | undefined,
  permission: Permission,
): boolean {
  const actor = toActor(roleOrActor);
  if (!actor || !isStaffRole(actor.role)) return false;

  const scope = resolveStaffScope(actor);

  switch (permission) {
    case Permission.VIEW_GUESTS:
    case Permission.CREATE_GUEST:
    case Permission.EDIT_GUEST:
    case Permission.RENEW_GUEST_KEY:
      return scopeCanGuests(actor);
    case Permission.DELETE_GUEST:
      return scopeIsGeneralManager(actor);
    case Permission.MANAGE_HOTEL:
      return scopeIsGeneralManager(actor);
    case Permission.MANAGE_STAFF:
      return scopeCanManageStaff(actor);
    case Permission.VIEW_TASKS:
    case Permission.MANAGE_TASKS:
      return scope === "general_manager" || scope === "department_manager";
    default:
      return false;
  }
}

/** Returns the display label for a staff role (legacy; prefer useStaffScope().label). */
export function roleLabel(role: string | undefined): string {
  if (role === "manager") return "Manager";
  if (role === "personnel") return "Staff";
  return "Staff";
}
