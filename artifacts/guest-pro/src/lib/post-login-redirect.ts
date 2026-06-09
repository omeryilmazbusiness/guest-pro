/**
 * Post-login navigation by role — shared across login screens.
 */

import { ROUTES } from "@/lib/app-routes";
import { resolveStaffScope } from "@/lib/staff-scope";
import type { AuthLoginUser } from "@/lib/auth-login";

export function getPostLoginPath(user: AuthLoginUser): string {
  if (user.role === "guest") return ROUTES.guest;

  if (user.role === "manager") {
    return ROUTES.manager;
  }

  if (user.role === "personnel") {
    const scope = resolveStaffScope({
      role: user.role,
      staffDepartment: user.staffDepartment,
    });
    if (scope === "restaurant_personnel") return ROUTES.restaurant;
    if (scope === "reception") return `${ROUTES.manager}?tab=guests`;
    if (scope === "staff_personnel") return ROUTES.staff;
    return ROUTES.manager;
  }

  return ROUTES.manager;
}
