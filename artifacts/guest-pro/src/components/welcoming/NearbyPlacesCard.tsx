/**
 * NearbyPlacesCard — clickable nearby places list with modal trigger.
 */

import { MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HotelConfig, WelcomingStrings } from "@/lib/welcoming/hotel-content";
import type { NearbyPlace } from "@/lib/welcoming/types";

const PLACE_ICON: Record<NearbyPlace["type"], string> = {
  market: "bg-teal-50 text-teal-600",
  pharmacy: "bg-rose-50 text-rose-600",
  bazaar: "bg-amber-50 text-amber-600",
  restaurant: "bg-orange-50 text-orange-600",
  other: "bg-zinc-100 text-zinc-500",
};

type PlaceLabelKey =
  | "placeTypeMarket"
  | "placeTypePharmacy"
  | "placeTypeBazaar"
  | "placeTypeRestaurant"
  | "placeTypeOther";

const TYPE_TO_LABEL_KEY: Record<NearbyPlace["type"], PlaceLabelKey> = {
  market: "placeTypeMarket",
  pharmacy: "placeTypePharmacy",
  bazaar: "placeTypeBazaar",
  restaurant: "placeTypeRestaurant",
  other: "placeTypeOther",
};

interface NearbyPlacesCardProps {
  config: HotelConfig;
  s: WelcomingStrings;
  onSelectPlace: (place: NearbyPlace) => void;
  className?: string;
}

export function NearbyPlacesCard({
  config,
  s,
  onSelectPlace,
  className,
}: NearbyPlacesCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
        <span className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-teal-600" />
        </span>
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
          {s.nearbySection}
        </p>
      </div>
      <div className="flex flex-col gap-0.5 px-3 pb-3">
        {config.nearbyPlaces.map((place) => {
          const typeLabel = s[TYPE_TO_LABEL_KEY[place.type]];
          const hasMap = Boolean(place.coords);
          return (
            <button
              key={place.name}
              type="button"
              onClick={() => onSelectPlace(place)}
              className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left w-full group"
            >
              <span
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold",
                  PLACE_ICON[place.type] ?? PLACE_ICON.other,
                )}
              >
                {typeLabel[0]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-zinc-900 truncate">{place.name}</p>
                <p className="text-[11px] text-zinc-400">{typeLabel}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-medium text-zinc-400">{place.distance}</span>
                {hasMap && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
