/**
 * GuestNearbySection — nearby places on the guest dashboard (/guest).
 */

import { useLocale } from "@/hooks/use-locale";
import { HOTEL_CONFIG, getWelcomingStrings } from "@/lib/welcoming/hotel-content";
import { getWelcomingLanguage } from "@/lib/welcoming/languages";
import { GuestNearbyExplorer } from "@/components/guest/GuestNearbyExplorer";
import { dash } from "@/lib/guest-dashboard-ui";
import { cn } from "@/lib/utils";

interface GuestNearbySectionProps {
  className?: string;
}

export function GuestNearbySection({ className }: GuestNearbySectionProps) {
  const { uiLocale, t } = useLocale();
  const welcomingLocale = getWelcomingLanguage(uiLocale).uiLocale;
  const s = getWelcomingStrings(welcomingLocale);

  return (
    <section className={cn(dash.section, className)} aria-label={t.nearbySection}>
      <GuestNearbyExplorer places={HOTEL_CONFIG.nearbyPlaces} s={s} t={t} />
    </section>
  );
}
