/**
 * Manager dashboard mobile drawer navigation.
 */

import {
  Users,
  Briefcase,
  ClipboardList,
  DoorOpen,
  Bell,
  TrendingUp,
  Plus,
  Settings,
  FileText,
  ChefHat,
  type LucideIcon,
} from "lucide-react";
import type { StaffTranslations } from "@/lib/staff-i18n";

export type ManagerDashboardTab =
  | "guests"
  | "rooms"
  | "requests"
  | "summary"
  | "team"
  | "tasks";

export type ManagerNavAction =
  | { type: "tab"; tab: ManagerDashboardTab }
  | { type: "create-guest" }
  | { type: "quick-report" }
  | { type: "settings" }
  | { type: "restaurant" };

export interface ManagerDashboardNavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  action: ManagerNavAction;
  badge?: number;
}

export interface ManagerDashboardNavContext {
  t: StaffTranslations;
  isManager: boolean;
  guestCount: number;
  roomCount: number;
  requestCount: number;
  teamCount: number;
  canCreateGuest: boolean;
}

type NavDef = {
  id: string;
  icon: LucideIcon;
  resolveLabel: (ctx: ManagerDashboardNavContext) => string;
  action: ManagerNavAction | ((ctx: ManagerDashboardNavContext) => ManagerNavAction);
  badge?: (ctx: ManagerDashboardNavContext) => number | undefined;
  isVisible?: (ctx: ManagerDashboardNavContext) => boolean;
};

const NAV_DEFS: NavDef[] = [
  {
    id: "team",
    icon: Briefcase,
    resolveLabel: ({ t }) => t.tabTeam,
    action: { type: "tab", tab: "team" },
    badge: (c) => (c.teamCount > 0 ? c.teamCount : undefined),
    isVisible: (c) => c.isManager,
  },
  {
    id: "tasks",
    icon: ClipboardList,
    resolveLabel: ({ t }) => t.tabTasks,
    action: { type: "tab", tab: "tasks" },
    isVisible: (c) => c.isManager,
  },
  {
    id: "guests",
    icon: Users,
    resolveLabel: ({ t }) => t.tabGuests,
    action: { type: "tab", tab: "guests" },
    badge: (c) => (c.guestCount > 0 ? c.guestCount : undefined),
  },
  {
    id: "rooms",
    icon: DoorOpen,
    resolveLabel: ({ t }) => t.tabRooms,
    action: { type: "tab", tab: "rooms" },
    badge: (c) => (c.roomCount > 0 ? c.roomCount : undefined),
    isVisible: (c) => !c.isManager,
  },
  {
    id: "requests",
    icon: Bell,
    resolveLabel: ({ t }) => t.tabRequests,
    action: { type: "tab", tab: "requests" },
    badge: (c) => (c.requestCount > 0 ? c.requestCount : undefined),
    isVisible: (c) => !c.isManager,
  },
  {
    id: "summary",
    icon: TrendingUp,
    resolveLabel: ({ t }) => t.tabSummary,
    action: { type: "tab", tab: "summary" },
    isVisible: (c) => c.isManager,
  },
  {
    id: "new-guest",
    icon: Plus,
    resolveLabel: ({ t }) => t.newGuest,
    action: { type: "create-guest" },
    isVisible: (c) => c.canCreateGuest,
  },
  {
    id: "quick-report",
    icon: FileText,
    resolveLabel: ({ t }) => t.quickReport,
    action: { type: "quick-report" },
    isVisible: (c) => c.isManager,
  },
  {
    id: "restaurant",
    icon: ChefHat,
    resolveLabel: ({ t }) => t.restaurantDashboard,
    action: { type: "restaurant" },
    isVisible: (c) => c.isManager,
  },
  {
    id: "settings",
    icon: Settings,
    resolveLabel: ({ t }) => t.settings,
    action: { type: "settings" },
    isVisible: (c) => c.isManager,
  },
];

export function buildManagerDashboardNavItems(
  ctx: ManagerDashboardNavContext,
): ManagerDashboardNavItem[] {
  return NAV_DEFS.filter((d) => d.isVisible?.(ctx) !== false).map((d) => ({
    id: d.id,
    icon: d.icon,
    label: d.resolveLabel(ctx),
    action: typeof d.action === "function" ? d.action(ctx) : d.action,
    badge: d.badge?.(ctx),
  }));
}
