import { UtensilsCrossed, HeartPulse, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import type { GuestTranslations } from "@/lib/i18n";
import { GuestConciergeQuickActions } from "@/components/guest/GuestConciergeQuickActions";

export type QuickActionMode = "food" | "support" | "care";

type ActionConfig = {
  mode: QuickActionMode;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  tile: string;
  iconWrap: string;
  iconColor: string;
  labelColor: string;
  shadow: string;
};

const ACTION_CONFIGS: ActionConfig[] = [
  {
    mode: "food",
    icon: UtensilsCrossed,
    tile: "bg-gradient-to-b from-orange-400 to-orange-500",
    iconWrap: "bg-white/25 ring-1 ring-white/30",
    iconColor: "text-white",
    labelColor: "text-white/95",
    shadow: "shadow-orange-500/25",
  },
  {
    mode: "support",
    icon: Hammer,
    tile: "bg-gradient-to-b from-sky-400 to-blue-500",
    iconWrap: "bg-white/25 ring-1 ring-white/30",
    iconColor: "text-white",
    labelColor: "text-white/95",
    shadow: "shadow-sky-500/25",
  },
  {
    mode: "care",
    icon: HeartPulse,
    tile: "bg-gradient-to-b from-rose-400 to-pink-500",
    iconWrap: "bg-white/25 ring-1 ring-white/30",
    iconColor: "text-white",
    labelColor: "text-white/95",
    shadow: "shadow-rose-500/25",
  },
];

interface ServiceQuickActionsProps {
  onAction: (mode: QuickActionMode) => void;
  t: GuestTranslations;
}

export function ServiceQuickActions({ onAction, t }: ServiceQuickActionsProps) {
  const labels: Record<QuickActionMode, string> = {
    food: t.quickActionFoodTitle,
    support: t.quickActionSupportTitle,
    care: t.quickActionCareTitle,
  };

  return (
    <section aria-label={t.quickActionsSection}>
      <h3 className={dash.sectionTitle}>{t.quickActionsSection}</h3>
      <div className="grid grid-cols-3 gap-2.5">
        {ACTION_CONFIGS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.mode}
              type="button"
              onClick={() => onAction(action.mode)}
              className={cn(
                "group flex flex-col items-center justify-center gap-2.5",
                "rounded-[1.35rem] px-2 py-4 min-h-[7.5rem]",
                "shadow-lg transition-all duration-200",
                "hover:brightness-105 hover:shadow-xl active:scale-[0.97]",
                action.tile,
                action.shadow,
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl",
                  "transition-transform duration-200 group-hover:scale-105",
                  action.iconWrap,
                )}
              >
                <Icon className={cn("h-5 w-5", action.iconColor)} strokeWidth={1.75} />
              </span>
              <span
                className={cn(
                  "text-[11px] font-semibold leading-tight text-center line-clamp-2 px-0.5",
                  action.labelColor,
                )}
              >
                {labels[action.mode]}
              </span>
            </button>
          );
        })}
      </div>

      <GuestConciergeQuickActions t={t} />
    </section>
  );
}
