/**
 * ManagerAnimatedTabs — iOS-style segmented control with spring pill indicator.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  ClipboardList,
  Users,
  DoorOpen,
  Bell,
  MessageSquare,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { PILL_SPRING } from "@/lib/manager-motion";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { ManagerDashboardTab } from "@/lib/manager-dashboard-nav";
import {
  canAccessManagerTab,
  type StaffScopeKind,
} from "@/lib/staff-scope";
import { cn } from "@/lib/utils";

interface TabDef {
  key: ManagerDashboardTab;
  label: string;
  icon: LucideIcon;
  count: number;
}

interface ManagerAnimatedTabsProps {
  active: ManagerDashboardTab;
  onChange: (tab: ManagerDashboardTab) => void;
  scope: StaffScopeKind;
  guestCount: number;
  roomCount: number;
  requestCount: number;
  feedbackCount: number;
  teamCount: number;
  t: StaffTranslations;
}

const ALL_TABS: Omit<TabDef, "label">[] = [
  { key: "team", icon: Briefcase, count: 0 },
  { key: "tasks", icon: ClipboardList, count: 0 },
  { key: "guests", icon: Users, count: 0 },
  { key: "rooms", icon: DoorOpen, count: 0 },
  { key: "requests", icon: Bell, count: 0 },
  { key: "feedback", icon: MessageSquare, count: 0 },
  { key: "summary", icon: TrendingUp, count: 0 },
];

export function ManagerAnimatedTabs({
  active,
  onChange,
  scope,
  guestCount,
  roomCount,
  requestCount,
  feedbackCount,
  teamCount,
  t,
}: ManagerAnimatedTabsProps) {
  const counts: Record<ManagerDashboardTab, number> = {
    team: teamCount,
    tasks: 0,
    guests: guestCount,
    rooms: roomCount,
    requests: requestCount,
    feedback: feedbackCount,
    summary: 0,
  };

  const labels: Record<ManagerDashboardTab, string> = {
    team: t.tabTeam,
    tasks: t.tabTasks,
    guests: t.tabGuests,
    rooms: t.tabRooms,
    requests: t.tabRequests,
    feedback: t.tabFeedback,
    summary: t.tabSummary,
  };

  const visibleTabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => canAccessManagerTab(scope, tab.key)).map((tab) => ({
        ...tab,
        label: labels[tab.key],
        count: counts[tab.key],
      })),
    [scope, t, guestCount, roomCount, requestCount, feedbackCount, teamCount],
  );

  const activeIndex = visibleTabs.findIndex((tab) => tab.key === active);

  return (
    <div
      className="relative flex gap-0.5 overflow-x-auto rounded-2xl bg-zinc-100/90 p-1"
      style={{ scrollbarWidth: "none" }}
      role="tablist"
    >
      {visibleTabs.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative z-10 flex min-w-[4.5rem] flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[12px] font-semibold transition-colors touch-manipulation shrink-0",
              isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="manager-tab-pill"
                className="absolute inset-0 rounded-xl bg-white shadow-sm shadow-zinc-900/5"
                transition={PILL_SPRING}
              />
            )}
            <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="relative z-10 truncate">{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={cn(
                  "relative z-10 rounded-md px-1 py-px font-mono text-[10px] tabular-nums",
                  isActive ? "bg-zinc-100 text-zinc-600" : "bg-zinc-200/80 text-zinc-500",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
      <span className="sr-only">Tab {activeIndex + 1} of {visibleTabs.length}</span>
    </div>
  );
}
