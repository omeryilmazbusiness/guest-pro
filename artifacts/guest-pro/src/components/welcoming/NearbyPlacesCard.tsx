/**
 * NearbyPlacesCard — clickable nearby places list with modal trigger.
 */

import { MapPin, ChevronRight, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HotelConfig, WelcomingStrings } from "@/lib/welcoming/hotel-content";
import type { NearbyPlace } from "@/lib/welcoming/types";
import { getNearbyTypeLabel } from "@/lib/welcoming/nearby-place-meta";
import { NearbyPlaceTypeIcon } from "./NearbyPlaceTypeIcon";

interface NearbyPlacesCardProps {
  config: HotelConfig;
  s: WelcomingStrings;
  onSelectPlace: (place: NearbyPlace) => void;
  className?: string;
  variant?: "default" | "dashboard";
  hint?: string;
}

export function NearbyPlacesCard({
  config,
  s,
  onSelectPlace,
  className,
  variant = "default",
  hint,
}: NearbyPlacesCardProps) {
  const isDashboard = variant === "dashboard";

  return (
    <div
      className={cn(
        "bg-white border border-zinc-100 shadow-sm overflow-hidden rounded-2xl",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3 border-b border-zinc-50",
          isDashboard ? "px-3.5 pt-3 pb-2.5" : "px-5 pt-5 pb-3",
        )}
      >
        <span
          className={cn(
            "rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0",
            isDashboard ? "w-9 h-9" : "w-8 h-8",
          )}
        >
          <MapPin className="w-4 h-4 text-teal-600" strokeWidth={1.75} />
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <p
            className={cn(
              "font-semibold text-zinc-900 tracking-tight",
              isDashboard ? "text-[14px] leading-snug" : "text-[11px] uppercase tracking-widest text-zinc-400",
            )}
          >
            {s.nearbySection}
          </p>
          {isDashboard && hint && (
            <p className="text-[12px] text-zinc-500 mt-0.5 leading-snug">{hint}</p>
          )}
        </div>
      </div>

      <div className={cn("flex flex-col", isDashboard ? "gap-1.5 p-2" : "gap-0.5 px-3 pb-3")}>
        {config.nearbyPlaces.map((place) => {
          const typeLabel = getNearbyTypeLabel(s, place.type);
          const hasMap = Boolean(place.coords);
          return (
            <button
              key={place.name}
              type="button"
              onClick={() => onSelectPlace(place)}
              className={cn(
                "flex items-center gap-3 text-left w-full group transition-all",
                isDashboard
                  ? "px-3 py-2.5 rounded-xl border border-zinc-100 bg-zinc-50/40 hover:bg-white hover:border-zinc-200 active:scale-[0.99]"
                  : "py-2.5 px-2 rounded-xl hover:bg-zinc-50 active:bg-zinc-100",
              )}
            >
              <NearbyPlaceTypeIcon type={place.type} size={isDashboard ? "sm" : "md"} />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-semibold text-zinc-900 truncate",
                    isDashboard ? "text-[14px] leading-snug" : "text-[14px] font-medium",
                  )}
                >
                  {place.name}
                </p>
                <p className={cn("text-zinc-500", isDashboard ? "text-[11px] mt-0.5" : "text-[11px]")}>
                  {typeLabel}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={cn(
                    "font-semibold text-zinc-600 bg-white border border-zinc-100 rounded-lg",
                    isDashboard ? "text-[10px] px-1.5 py-0.5" : "text-[11px] font-medium text-zinc-400",
                  )}
                >
                  {place.distance}
                </span>
                {isDashboard && hasMap && (
                  <span className="flex items-center gap-0.5 text-[11px] font-medium text-teal-600">
                    <Navigation className="w-3 h-3" />
                    <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
                {!isDashboard && hasMap && (
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
