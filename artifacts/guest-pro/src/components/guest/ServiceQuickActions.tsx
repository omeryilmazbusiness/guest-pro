import { UtensilsCrossed, HeartPulse, Hammer } from "lucide-react";
import { dash } from "@/lib/guest-dashboard-ui";
import type { GuestTranslations } from "@/lib/i18n";
import { GuestConciergeQuickActions } from "@/components/guest/GuestConciergeQuickActions";
import { GuestIconActionTile } from "@/components/guest/GuestIconActionTile";

export type QuickActionMode = "food" | "support" | "care";

const ACTION_CONFIGS = [
  {
    mode: "food" as const,
    icon: UtensilsCrossed,
    iconColor: "text-orange-500",
  },
  {
    mode: "support" as const,
    icon: Hammer,
    iconColor: "text-blue-500",
  },
  {
    mode: "care" as const,
    icon: HeartPulse,
    iconColor: "text-rose-500",
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
      <div className="grid grid-cols-3 gap-1">
        {ACTION_CONFIGS.map((action) => (
          <GuestIconActionTile
            key={action.mode}
            icon={action.icon}
            iconClassName={action.iconColor}
            label={labels[action.mode]}
            onClick={() => onAction(action.mode)}
          />
        ))}
      </div>

      <GuestConciergeQuickActions t={t} />
    </section>
  );
}
