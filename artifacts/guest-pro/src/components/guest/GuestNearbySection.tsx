/**
 * GuestNearbySection — nearby places on the guest dashboard (/guest).
 * Always visible for authenticated guests (map + list or empty state).
 */

import { useMemo } from "react";
import { useLocale } from "@/hooks/use-locale";
import { useGuestNearbyPlaces } from "@/hooks/use-guest-nearby-places";
import { getWelcomingStrings } from "@/lib/welcoming/hotel-content";
import { getWelcomingLanguage } from "@/lib/welcoming/languages";
import { resolveHotelCenter } from "@/lib/nearby/nearby-distance";
import { GuestNearbyExplorer } from "@/components/guest/GuestNearbyExplorer";
import { dash } from "@/lib/guest-dashboard-ui";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, RefreshCw } from "lucide-react";

interface GuestNearbySectionProps {
  className?: string;
}

export function GuestNearbySection({ className }: GuestNearbySectionProps) {
  const { uiLocale, t } = useLocale();
  const welcomingLocale = getWelcomingLanguage(uiLocale).uiLocale;
  const s = getWelcomingStrings(welcomingLocale);
  const { data, isLoading, isError, refetch, isFetching } = useGuestNearbyPlaces();

  const places = data?.places ?? [];
  const apiHotelCenter = data?.hotelCenter ?? null;
  const hotelCenter = useMemo(
    () => resolveHotelCenter(apiHotelCenter, places),
    [apiHotelCenter, places],
  );
  const hotelLabel = apiHotelCenter?.label ?? null;

  if (isLoading) {
    return (
      <section className={cn(dash.section, className)} aria-label={t.nearbySection}>
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className={cn(dash.section, className)} aria-label={t.nearbySection}>
        <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-8 text-center shadow-sm">
          <MapPin className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-[13px] text-zinc-600">{t.nearbyLoadFailed}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            {t.nearbyRetry}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={cn(dash.section, className)} aria-label={t.nearbySection}>
      <GuestNearbyExplorer
        places={places}
        hotelCenter={hotelCenter}
        hotelLabel={hotelLabel}
        s={s}
        t={t}
        locale={uiLocale}
      />
    </section>
  );
}
