/**
 * Staff scope — client mirror of api-server/src/lib/staff-scope.ts
 * Keep in sync when changing hierarchy rules.
 */

import { STAFF_DEPARTMENTS, type StaffDepartment } from "@/lib/staff";

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

export function getDepartmentScope(actor: StaffActor): StaffDepartment | null {
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

export function scopeLabel(
  scope: StaffScopeKind,
  department?: string | null,
  labels?: Partial<Record<StaffScopeKind, string>>,
): string {
  const defaults: Record<StaffScopeKind, string> = {
    general_manager: "General Manager",
    department_manager: department ? `${department} Manager` : "Department Manager",
    reception: "Reception",
    operations_personnel: department ?? "Operations",
    restaurant_personnel: "Restaurant",
  };
  return labels?.[scope] ?? defaults[scope];
}

export function isValidStaffDepartment(dept: unknown): dept is StaffDepartment {
  return (STAFF_DEPARTMENTS as readonly unknown[]).includes(dept);
}
