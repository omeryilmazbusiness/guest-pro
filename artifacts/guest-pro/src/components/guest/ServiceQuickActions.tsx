import { UtensilsCrossed, Bell, Heart } from "lucide-react";
import type { GuestTranslations } from "@/lib/i18n";

export type QuickActionMode = "food" | "support" | "care";

type ActionConfig = {
  mode: QuickActionMode;
  icon: React.FC<{ className?: string }>;
  accent: string;
  iconBg: string;
  iconColor: string;
};

const ACTION_CONFIGS: ActionConfig[] = [
  {
    mode: "food",
    icon: UtensilsCrossed,
    accent: "border-amber-100",
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-500",
  },
  {
    mode: "support",
    icon: Bell,
    accent: "border-yellow-100",
    iconBg: "bg-yellow-50 border-yellow-100",
    iconColor: "text-yellow-500",
  },
  {
    mode: "care",
    icon: Heart,
    accent: "border-rose-100",
    iconBg: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-400",
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
    <section>
      <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3 px-1">
        {t.quickActionsSection}
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {ACTION_CONFIGS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.mode}
              onClick={() => onAction(action.mode)}
              className={`bg-white border ${action.accent} rounded-2xl px-3 py-4 flex flex-col items-center text-center shadow-sm active:scale-[0.96] hover:shadow-md transition-all duration-150 group`}
            >
              <div
                className={`w-10 h-10 rounded-xl border ${action.iconBg} flex items-center justify-center mb-3 transition-transform group-active:scale-95`}
              >
                <Icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              <p className="text-[13px] font-semibold text-zinc-800 leading-tight">
                {titles[action.mode]}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                {subtitles[action.mode]}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
