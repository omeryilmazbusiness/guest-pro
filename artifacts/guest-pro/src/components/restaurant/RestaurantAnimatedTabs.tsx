/**
 * RestaurantAnimatedTabs — icon-only tabs with soft animated selection (manager parity).
 */

import { Bell, UtensilsCrossed, Heart, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { PILL_SPRING } from "@/lib/manager-motion";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { cn } from "@/lib/utils";

export type RestaurantTab = "orders" | "menu" | "care";

interface TabDef {
  key: RestaurantTab;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  count?: number;
}

interface RestaurantAnimatedTabsProps {
  active: RestaurantTab;
  onChange: (tab: RestaurantTab) => void;
  openOrderCount: number;
  t: StaffTranslations;
}

const TAB_ICON_CLASS: Record<RestaurantTab, string> = {
  orders: "text-amber-600",
  menu: "text-orange-600",
  care: "text-rose-500",
};

export function RestaurantAnimatedTabs({
  active,
  onChange,
  openOrderCount,
  t,
}: RestaurantAnimatedTabsProps) {
  const tabs: TabDef[] = [
    {
      key: "orders",
      label: t.tabOrders,
      icon: Bell,
      iconClassName: TAB_ICON_CLASS.orders,
      count: openOrderCount,
    },
    {
      key: "menu",
      label: t.tabMenu,
      icon: UtensilsCrossed,
      iconClassName: TAB_ICON_CLASS.menu,
    },
    {
      key: "care",
      label: t.tabCare,
      icon: Heart,
      iconClassName: TAB_ICON_CLASS.care,
    },
  ];

  const activeIndex = tabs.findIndex((tab) => tab.key === active);

  return (
    <div
      className="flex gap-1.5 overflow-x-auto px-0.5"
      style={{ scrollbarWidth: "none" }}
      role="tablist"
    >
      {tabs.map((tab) => {
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
                layoutId="restaurant-tab-frame"
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
              {(tab.count ?? 0) > 0 && (
                <span
                  className={cn(
                    "absolute -top-1.5 -end-2.5 min-w-[13px] rounded-sm px-1 py-px text-center font-mono text-[7px] font-bold leading-none",
                    isActive ? "bg-white text-zinc-900" : "bg-zinc-900 text-white",
                  )}
                >
                  {tab.count! > 99 ? "99+" : tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
      <span className="sr-only">
        {tabs[activeIndex]?.label} — tab {activeIndex + 1} of {tabs.length}
      </span>
    </div>
  );
}
