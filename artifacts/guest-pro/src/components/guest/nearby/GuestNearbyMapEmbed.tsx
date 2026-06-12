import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NearbyPlace, PlaceCoords } from "@/lib/welcoming/types";
import { buildGuestNearbyMapEmbedUrl } from "@/lib/welcoming/maps";
import { NearbyPlaceTypeIcon } from "@/components/welcoming/NearbyPlaceTypeIcon";

interface GuestNearbyMapEmbedProps {
  hotelCenter: PlaceCoords | null;
  hotelLabel?: string | null;
  selectedPlace?: NearbyPlace | null;
  mapUnavailableLabel: string;
  hotelPinLabel?: string;
  className?: string;
  /** iframe height in px — guest dashboard uses a compact map */
  height?: number;
}

export function GuestNearbyMapEmbed({
  hotelCenter,
  hotelLabel,
  selectedPlace,
  mapUnavailableLabel,
  hotelPinLabel = "Hotel",
  className,
  height = 260,
}: GuestNearbyMapEmbedProps) {
  const embedSrc = hotelCenter
    ? buildGuestNearbyMapEmbedUrl(hotelCenter, {
        selectedPlace: selectedPlace?.coords ?? null,
        hotelLabel,
      })
    : selectedPlace?.coords
      ? buildGuestNearbyMapEmbedUrl(selectedPlace.coords)
      : null;

  if (!embedSrc) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 text-center",
          className,
        )}
        style={{ minHeight: height }}
      >
        <p className="max-w-[220px] text-[12px] leading-relaxed text-zinc-500">{mapUnavailableLabel}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-100/90 bg-zinc-100",
        className,
      )}
    >
      <iframe
        key={embedSrc}
        src={embedSrc}
        title="Nearby map"
        width="100%"
        height={height}
        style={{ border: 0, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      {hotelCenter && (
        <div className="pointer-events-none absolute start-3 top-3 z-10">
          <span className="inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full border border-teal-200/90 bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-teal-900 shadow-md backdrop-blur-md">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
              <Building2 className="h-3 w-3" strokeWidth={2.25} />
            </span>
            <span className="truncate">{hotelLabel?.trim() || hotelPinLabel}</span>
          </span>
        </div>
      )}

      {selectedPlace && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-3 pb-3 pt-10">
          <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/95 px-2.5 py-2 shadow-lg backdrop-blur-md">
            <NearbyPlaceTypeIcon type={selectedPlace.type} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-zinc-900">{selectedPlace.name}</p>
              {selectedPlace.distance !== "—" && (
                <p className="text-[10px] font-medium text-zinc-500">{selectedPlace.distance}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
