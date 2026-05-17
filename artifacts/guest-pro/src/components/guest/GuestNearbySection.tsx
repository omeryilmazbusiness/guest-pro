/**
 * GuestNearbySection — nearby places at the bottom of guest dashboard screens.
 */

import { useState, useCallback } from "react";
import { useLocale } from "@/hooks/use-locale";
import { HOTEL_CONFIG, getWelcomingStrings } from "@/lib/welcoming/hotel-content";
import { getWelcomingLanguage } from "@/lib/welcoming/languages";
import type { NearbyPlace } from "@/lib/welcoming/types";
import { NearbyPlacesCard } from "@/components/welcoming/NearbyPlacesCard";
import { NearbyPlaceModal } from "@/components/welcoming/NearbyPlaceModal";
import { cn } from "@/lib/utils";

interface GuestNearbySectionProps {
  className?: string;
}

export function GuestNearbySection({ className }: GuestNearbySectionProps) {
  const { uiLocale } = useLocale();
  const welcomingLocale = getWelcomingLanguage(uiLocale).uiLocale;
  const s = getWelcomingStrings(welcomingLocale);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  const handleSelectPlace = useCallback((place: NearbyPlace) => {
    setSelectedPlace(place);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  return (
    <>
      <section className={cn("w-full", className)} aria-label={s.nearbySection}>
        <NearbyPlacesCard
          config={HOTEL_CONFIG}
          s={s}
          onSelectPlace={handleSelectPlace}
        />
      </section>
      <NearbyPlaceModal place={selectedPlace} s={s} onClose={handleCloseModal} />
    </>
  );
}
