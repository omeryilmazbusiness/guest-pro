import { useState } from "react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import type { GuestTranslations } from "@/lib/i18n";
import { CONCIERGE_SERVICES, type ConciergeService } from "@/lib/guest-concierge";
import { GuestConciergeBookingSheet } from "@/components/guest/GuestConciergeBookingSheet";
import { GuestTactileTile } from "@/components/guest/GuestTactileTile";

interface GuestConciergeQuickActionsProps {
  t: GuestTranslations;
}

export function GuestConciergeQuickActions({ t }: GuestConciergeQuickActionsProps) {
  const [activeService, setActiveService] = useState<ConciergeService | null>(null);

  return (
    <>
      <h3 className={cn(dash.sectionTitle, "mt-4")}>{t.quickActionsOthersSection}</h3>
      <div className="grid grid-cols-4 gap-2">
        {CONCIERGE_SERVICES.map((action) => (
          <GuestTactileTile
            key={action.id}
            size="sm"
            onClick={() => setActiveService(action.id)}
            className={cn("hover:brightness-105 hover:shadow-lg", action.tile, action.shadow)}
            icon={action.icon}
            iconWrapClassName={action.iconWrap}
            iconClassName={action.iconColor}
            labelClassName={action.labelColor}
            label={t[action.titleKey]}
            commitHaptic
          />
        ))}
      </div>

      <GuestConciergeBookingSheet
        open={activeService != null}
        service={activeService}
        onClose={() => setActiveService(null)}
        t={t}
      />
    </>
  );
}
