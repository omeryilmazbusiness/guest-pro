/**
 * ManagerAnimatedTabs — icon-only tabs with animated black rectangular selection.
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
  iconClassName: string;
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

const TAB_ICON_CLASS: Record<ManagerDashboardTab, string> = {
  team: "text-violet-600",
  tasks: "text-blue-600",
  guests: "text-sky-600",
  rooms: "text-amber-600",
  requests: "text-rose-500",
  feedback: "text-teal-600",
  summary: "text-emerald-600",
};

const ALL_TABS: Omit<TabDef, "label" | "count">[] = [
  { key: "team", icon: Briefcase, iconClassName: TAB_ICON_CLASS.team },
  { key: "tasks", icon: ClipboardList, iconClassName: TAB_ICON_CLASS.tasks },
  { key: "guests", icon: Users, iconClassName: TAB_ICON_CLASS.guests },
  { key: "rooms", icon: DoorOpen, iconClassName: TAB_ICON_CLASS.rooms },
  { key: "requests", icon: Bell, iconClassName: TAB_ICON_CLASS.requests },
  { key: "feedback", icon: MessageSquare, iconClassName: TAB_ICON_CLASS.feedback },
  { key: "summary", icon: TrendingUp, iconClassName: TAB_ICON_CLASS.summary },
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
      className="flex gap-1.5 overflow-x-auto px-0.5"
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
            aria-label={tab.label}
            title={tab.label}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative flex min-w-[3.5rem] flex-1 items-center justify-center px-4 py-2",
              "transition-opacity duration-150 hover:opacity-90 active:opacity-80 touch-manipulation shrink-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 rounded-md",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="manager-tab-frame"
                className="absolute inset-0 rounded-md bg-zinc-900 shadow-sm shadow-zinc-900/20"
                transition={PILL_SPRING}
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center" aria-hidden>
              <Icon
                className={cn(
                  "guest-chat-entry-icon h-5 w-5",
                  isActive ? "text-white" : tab.iconClassName,
                  !isActive && "opacity-45",
                )}
                strokeWidth={1.5}
              />
              {tab.count > 0 && (
                <span
                  className={cn(
                    "absolute -top-1.5 -end-2.5 min-w-[13px] rounded-sm px-1 py-px text-center font-mono text-[7px] font-bold leading-none",
                    isActive ? "bg-white text-zinc-900" : "bg-zinc-900 text-white",
                  )}
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
      <span className="sr-only">
        {labels[active]} — tab {activeIndex + 1} of {visibleTabs.length}
      </span>
    </div>
  );
}
