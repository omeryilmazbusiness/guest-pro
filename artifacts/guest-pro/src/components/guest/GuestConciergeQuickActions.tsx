import { useState } from "react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import type { GuestTranslations } from "@/lib/i18n";
import { CONCIERGE_SERVICES, type ConciergeService } from "@/lib/guest-concierge";
import { GuestConciergeBookingSheet } from "@/components/guest/GuestConciergeBookingSheet";

interface GuestConciergeQuickActionsProps {
  t: GuestTranslations;
}

export function GuestConciergeQuickActions({ t }: GuestConciergeQuickActionsProps) {
  const [activeService, setActiveService] = useState<ConciergeService | null>(null);

  return (
    <>
      <h3 className={cn(dash.sectionTitle, "mt-4")}>{t.quickActionsOthersSection}</h3>
      <div className="grid grid-cols-4 gap-2">
        {CONCIERGE_SERVICES.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => setActiveService(action.id)}
              className={cn(
                "group flex flex-col items-center justify-center gap-2",
                "rounded-[1.15rem] px-1.5 py-3 min-h-[5.75rem]",
                "shadow-md transition-all duration-200",
                "hover:brightness-105 hover:shadow-lg active:scale-[0.97]",
                action.tile,
                action.shadow,
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  "transition-transform duration-200 group-hover:scale-105",
                  action.iconWrap,
                )}
              >
                <Icon className={cn("h-4 w-4", action.iconColor)} strokeWidth={1.75} />
              </span>
              <span
                className={cn(
                  "text-[9px] font-semibold leading-tight text-center line-clamp-2 px-0.5",
                  action.labelColor,
                )}
              >
                {t[action.titleKey]}
              </span>
            </button>
          );
        })}
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
