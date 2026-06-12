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
import { cn } from "@/lib/utils";
import { Loader2, MapPin, RefreshCw } from "lucide-react";

const guestFramedLight =
  "overflow-hidden rounded-2xl bg-white shadow-[0_12px_36px_-14px_rgba(0,0,0,0.14)] ring-1 ring-zinc-200/80";

interface GuestNearbySectionProps {
  className?: string;
}

function NearbyFramedState({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className={guestFramedLight}>
      <div className="border-b border-zinc-100 px-4 py-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{title}</p>
      </div>
      {children}
    </div>
  );
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
      <section className={cn("mb-4", className)} aria-label={t.nearbySection}>
        <NearbyFramedState title={s.nearbySection}>
          <div className="flex items-center justify-center gap-2 py-6">
            <MapPin className="h-5 w-5 text-teal-400/70" strokeWidth={1.5} />
            <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
          </div>
        </NearbyFramedState>
      </section>
    );
  }

  if (isError) {
    return (
      <section className={cn("mb-4", className)} aria-label={t.nearbySection}>
        <NearbyFramedState title={s.nearbySection}>
          <div className="flex flex-col items-center px-3 py-6 text-center">
            <MapPin className="h-6 w-6 text-teal-400/70" strokeWidth={1.5} />
            <p className="mt-2 max-w-[14rem] text-[12px] leading-snug text-zinc-600">
              {t.nearbyLoadFailed}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              {t.nearbyRetry}
            </button>
          </div>
        </NearbyFramedState>
      </section>
    );
  }

  return (
    <section className={cn("mb-4", className)} aria-label={t.nearbySection}>
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
