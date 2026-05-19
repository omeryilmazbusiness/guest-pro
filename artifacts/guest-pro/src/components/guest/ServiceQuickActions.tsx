import { UtensilsCrossed, Bell, Heart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import type { GuestTranslations } from "@/lib/i18n";

export type QuickActionMode = "food" | "support" | "care";

type ActionConfig = {
  mode: QuickActionMode;
  icon: React.FC<{ className?: string }>;
  cardBg: string;
  accent: string;
  iconWrap: string;
  iconColor: string;
};

const ACTION_CONFIGS: ActionConfig[] = [
  {
    mode: "food",
    icon: UtensilsCrossed,
    cardBg: "bg-gradient-to-br from-white via-white to-orange-50/50",
    accent: "bg-orange-400/70",
    iconWrap: "bg-orange-50 border-orange-100/90",
    iconColor: "text-orange-600",
  },
  {
    mode: "support",
    icon: Bell,
    cardBg: "bg-gradient-to-br from-white via-white to-sky-50/50",
    accent: "bg-sky-400/70",
    iconWrap: "bg-sky-50 border-sky-100/90",
    iconColor: "text-sky-600",
  },
  {
    mode: "care",
    icon: Heart,
    cardBg: "bg-gradient-to-br from-white via-white to-rose-50/50",
    accent: "bg-rose-400/70",
    iconWrap: "bg-rose-50 border-rose-100/90",
    iconColor: "text-rose-500",
  },
];

interface ServiceQuickActionsProps {
  onAction: (mode: QuickActionMode) => void;
  t: GuestTranslations;
}

export function ServiceQuickActions({ onAction, t }: ServiceQuickActionsProps) {
  const titles: Record<QuickActionMode, string> = {
    food: t.quickActionFoodTitle,
    support: t.quickActionSupportTitle,
    care: t.quickActionCareTitle,
  };
  const subtitles: Record<QuickActionMode, string> = {
    food: t.quickActionFoodSubtitle,
    support: t.quickActionSupportSubtitle,
    care: t.quickActionCareSubtitle,
  };

  return (
    <section aria-label={t.quickActionsSection}>
      <h3 className={dash.sectionTitle}>{t.quickActionsSection}</h3>
      <div className={cn("flex flex-col", dash.rowGap)}>
        {ACTION_CONFIGS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.mode}
              type="button"
              onClick={() => onAction(action.mode)}
              className={cn(dash.lightCard, action.cardBg, "w-full text-left group")}
            >
              <span className="relative flex items-center gap-2.5 px-3 py-2.5">
                <span
                  className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-full", action.accent)}
                  aria-hidden
                />
                <span
                  className={cn(
                    "ml-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                    action.iconWrap,
                  )}
                >
                  <Icon className={cn("w-4 h-4", action.iconColor)} />
                </span>
                <span className="flex-1 min-w-0">
                  <p className={dash.title}>{titles[action.mode]}</p>
                  <p className={cn(dash.subtitle, "mt-0.5")}>{subtitles[action.mode]}</p>
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
