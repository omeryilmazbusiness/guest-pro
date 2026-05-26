import { motion } from "framer-motion";
import { Activity, Building2, Plus, Settings, type LucideIcon } from "lucide-react";
import { PILL_SPRING } from "@/lib/manager-motion";
import { cn } from "@/lib/utils";

export type PlatformDashboardTab = "hotels" | "add-hotel" | "track" | "settings";

const TABS: { key: PlatformDashboardTab; label: string; icon: LucideIcon }[] = [
  { key: "hotels", label: "Hotels", icon: Building2 },
  { key: "add-hotel", label: "New hotel", icon: Plus },
  { key: "track", label: "Track", icon: Activity },
  { key: "settings", label: "Settings", icon: Settings },
];

interface PlatformDashboardTabsProps {
  active: PlatformDashboardTab;
  onChange: (tab: PlatformDashboardTab) => void;
  hotelCount: number;
}

export function PlatformDashboardTabs({ active, onChange, hotelCount }: PlatformDashboardTabsProps) {
  return (
    <div className="mx-auto hidden max-w-2xl px-4 pb-3 pt-4 md:block">
      <div className="relative flex rounded-2xl bg-zinc-100/80 p-1 ring-1 ring-zinc-200/60">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors sm:flex-row sm:justify-center sm:gap-1.5 sm:py-2.5 sm:text-xs",
                isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="platform-tab-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/80"
                  transition={PILL_SPRING}
                />
              )}
              <span className="relative flex items-center gap-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {tab.key === "hotels" && hotelCount > 0 && (
                  <span className="font-mono text-[10px] tabular-nums text-zinc-400">({hotelCount})</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
