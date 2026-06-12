import { useState } from "react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import type { GuestTranslations } from "@/lib/i18n";
import { CONCIERGE_SERVICES, type ConciergeService } from "@/lib/guest-concierge";
import { GuestConciergeBookingSheet } from "@/components/guest/GuestConciergeBookingSheet";
import { GuestIconActionTile } from "@/components/guest/GuestIconActionTile";

interface GuestConciergeQuickActionsProps {
  t: GuestTranslations;
}

export function GuestConciergeQuickActions({ t }: GuestConciergeQuickActionsProps) {
  const [activeService, setActiveService] = useState<ConciergeService | null>(null);

  return (
    <>
      <h3 className={cn(dash.sectionTitle, "mt-4")}>{t.quickActionsOthersSection}</h3>
      <div className="grid grid-cols-4 gap-1">
        {CONCIERGE_SERVICES.map((action) => (
          <GuestIconActionTile
            key={action.id}
            size="sm"
            icon={action.icon}
            iconClassName={action.iconColor}
            label={t[action.titleKey]}
            onClick={() => setActiveService(action.id)}
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
