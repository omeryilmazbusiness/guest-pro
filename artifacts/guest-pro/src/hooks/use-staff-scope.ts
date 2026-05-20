/**
 * useStaffScope — derives dashboard capabilities from the authenticated user.
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  resolveStaffScope,
  getDepartmentScope,
  getVisibleManagerTabs,
  getDefaultManagerTab,
  canAccessManagerTab,
  canAccessGuestOperations,
  canManageStaff,
  isGeneralManager,
  isAnyManager,
  scopeLabel,
  type StaffScopeKind,
  type ManagerDashboardTab,
} from "@/lib/staff-scope";

export interface StaffScopeView {
  actor: { role: string; staffDepartment: string | null | undefined };
  scope: StaffScopeKind;
  departmentScope: ReturnType<typeof getDepartmentScope>;
  visibleTabs: ManagerDashboardTab[];
  defaultTab: ManagerDashboardTab;
  canAccessTab: (tab: ManagerDashboardTab) => boolean;
  canViewGuests: boolean;
  canManageTeam: boolean;
  isGeneralManager: boolean;
  isAnyManager: boolean;
  label: string;
}

export function useStaffScope(): StaffScopeView | null {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user?.role) return null;

    const actor = {
      role: user.role,
      staffDepartment:
        "staffDepartment" in user
          ? (user as { staffDepartment?: string | null }).staffDepartment
          : null,
    };

    const scope = resolveStaffScope(actor);
    const departmentScope = getDepartmentScope(actor);

    return {
      actor,
      scope,
      departmentScope,
      visibleTabs: getVisibleManagerTabs(scope),
      defaultTab: getDefaultManagerTab(scope),
      canAccessTab: (tab) => canAccessManagerTab(scope, tab),
      canViewGuests: canAccessGuestOperations(actor),
      canManageTeam: canManageStaff(actor),
      isGeneralManager: isGeneralManager(actor),
      isAnyManager: isAnyManager(actor),
      label: scopeLabel(scope, actor.staffDepartment),
    };
  }, [user]);
}
