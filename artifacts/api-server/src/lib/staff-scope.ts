/**
 * Staff scope — who the user is in the hotel hierarchy (single source of truth).
 *
 * Model (no DB migration):
 *   manager + staffDepartment null     → General Manager (full access)
 *   manager + HOUSEKEEPING|BELLMAN|RESTAURANT → Department Manager
 *   personnel + RECEPTION              → Reception (guests only)
 *   personnel + RESTAURANT             → Restaurant ops (separate app)
 *   personnel + other                  → Operations (rooms & requests)
 */

import {
  STAFF_DEPARTMENTS,
  type StaffDepartment,
} from "./roles";

export const DEPARTMENT_MANAGER_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "RESTAURANT",
] as const satisfies readonly StaffDepartment[];

export type DepartmentManagerDepartment = (typeof DEPARTMENT_MANAGER_DEPARTMENTS)[number];

export type StaffScopeKind =
  | "general_manager"
  | "department_manager"
  | "reception"
  | "operations_personnel"
  | "restaurant_personnel";

export interface StaffActor {
  role: string;
  staffDepartment?: string | null;
}

export function isDepartmentManagerDepartment(
  dept: string | null | undefined,
): dept is DepartmentManagerDepartment {
  return (
    dept != null &&
    (DEPARTMENT_MANAGER_DEPARTMENTS as readonly string[]).includes(dept)
  );
}

export function resolveStaffScope(actor: StaffActor): StaffScopeKind {
  const { role, staffDepartment } = actor;

  if (role === "manager") {
    if (isDepartmentManagerDepartment(staffDepartment)) {
      return "department_manager";
    }
    return "general_manager";
  }

  if (role === "personnel") {
    if (staffDepartment === "RESTAURANT") return "restaurant_personnel";
    if (staffDepartment === "RECEPTION") return "reception";
    return "operations_personnel";
  }

  return "operations_personnel";
}

/** Department filter for staff/task APIs; null = entire hotel. */
export function getDepartmentScope(
  actor: StaffActor,
): StaffDepartment | null {
  const scope = resolveStaffScope(actor);
  if (scope === "department_manager" && actor.staffDepartment) {
    return actor.staffDepartment as StaffDepartment;
  }
  return null;
}

export function isGeneralManager(actor: StaffActor): boolean {
  return resolveStaffScope(actor) === "general_manager";
}

export function isAnyManager(actor: StaffActor): boolean {
  const scope = resolveStaffScope(actor);
  return scope === "general_manager" || scope === "department_manager";
}

export function canAccessGuestOperations(actor: StaffActor): boolean {
  const scope = resolveStaffScope(actor);
  return scope === "general_manager" || scope === "reception";
}

export function canManageStaff(actor: StaffActor): boolean {
  return isAnyManager(actor);
}

export function canManageStaffMember(
  actor: StaffActor,
  member: { role: string; staffDepartment: string | null },
): boolean {
  if (!canManageStaff(actor)) return false;
  const scope = resolveStaffScope(actor);
  if (scope === "general_manager") {
    return member.role === "personnel";
  }
  if (scope === "department_manager") {
    return (
      member.role === "personnel" &&
      member.staffDepartment === actor.staffDepartment
    );
  }
  return false;
}

export type ManagerDashboardTab =
  | "guests"
  | "rooms"
  | "requests"
  | "summary"
  | "team"
  | "tasks";

export function getVisibleManagerTabs(scope: StaffScopeKind): ManagerDashboardTab[] {
  switch (scope) {
    case "general_manager":
      return ["team", "tasks", "guests", "summary"];
    case "department_manager":
      return ["team", "tasks"];
    case "reception":
      return ["guests"];
    case "operations_personnel":
      return ["rooms", "requests"];
    case "restaurant_personnel":
      return [];
  }
}

export function getDefaultManagerTab(scope: StaffScopeKind): ManagerDashboardTab {
  switch (scope) {
    case "general_manager":
    case "department_manager":
      return "team";
    case "reception":
      return "guests";
    case "operations_personnel":
      return "requests";
    case "restaurant_personnel":
      return "guests";
  }
}

export function canAccessManagerTab(
  scope: StaffScopeKind,
  tab: ManagerDashboardTab,
): boolean {
  return getVisibleManagerTabs(scope).includes(tab);
}

export function scopeLabel(scope: StaffScopeKind, department?: string | null): string {
  switch (scope) {
    case "general_manager":
      return "General Manager";
    case "department_manager":
      return department ? `${department} Manager` : "Department Manager";
    case "reception":
      return "Reception";
    case "operations_personnel":
      return department ?? "Operations";
    case "restaurant_personnel":
      return "Restaurant";
  }
}

export function isValidStaffDepartment(dept: unknown): dept is StaffDepartment {
  return (STAFF_DEPARTMENTS as readonly unknown[]).includes(dept);
}
