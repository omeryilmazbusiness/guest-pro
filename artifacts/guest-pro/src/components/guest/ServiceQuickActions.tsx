import { UtensilsCrossed, HeartPulse, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import type { GuestTranslations } from "@/lib/i18n";
import { GuestConciergeQuickActions } from "@/components/guest/GuestConciergeQuickActions";
import { GuestTactileTile } from "@/components/guest/GuestTactileTile";

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
        {ACTION_CONFIGS.map((action) => (
          <GuestTactileTile
            key={action.mode}
            onClick={() => onAction(action.mode)}
            className={cn("hover:brightness-105 hover:shadow-xl", action.tile, action.shadow)}
            icon={action.icon}
            iconWrapClassName={action.iconWrap}
            iconClassName={action.iconColor}
            labelClassName={action.labelColor}
            label={labels[action.mode]}
            commitHaptic
          />
        ))}
      </div>

      <GuestConciergeQuickActions t={t} />
    </section>
  );
}
