import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Check,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tFmt, type GuestTranslations } from "@/lib/i18n";
import type { WelcomingStrings } from "@/lib/welcoming/hotel-content";
import type { NearbyPlace, PlaceCoords } from "@/lib/welcoming/types";
import { resolveHotelCenter, sortPlacesByProximity } from "@/lib/nearby/nearby-distance";
import {
  NEARBY_TYPE_ORDER,
  getNearbyTypeLabel,
  type NearbyPlaceType,
} from "@/lib/welcoming/nearby-place-meta";
import { filterNearbyPlaces, type NearbyFilterKey } from "@/lib/nearby/nearby-filter";
import { NearbyPlaceTypeIcon } from "@/components/welcoming/NearbyPlaceTypeIcon";
import { NearbyPlaceDetail } from "@/components/welcoming/NearbyPlaceDetail";
import { GuestNearbyMapEmbed } from "@/components/guest/nearby/GuestNearbyMapEmbed";
import { GuestNearbyPlaceRow } from "@/components/guest/GuestNearbyPlaceRow";
import { GuestPremiumSheet } from "@/components/guest/GuestPremiumSheet";

const guestFramedLight =
  "overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_-12px_rgba(0,0,0,0.12)] ring-1 ring-zinc-200/80";

interface GuestNearbyExplorerProps {
  places: NearbyPlace[];
  hotelCenter: PlaceCoords | null;
  hotelLabel?: string | null;
  s: WelcomingStrings;
  t: GuestTranslations;
  locale?: string;
  className?: string;
}

export function GuestNearbyExplorer({
  places,
  hotelCenter: hotelCenterProp,
  hotelLabel,
  s,
  t,
  locale = "en",
  className,
}: GuestNearbyExplorerProps) {
  const [previewPlace, setPreviewPlace] = useState<NearbyPlace | null>(null);
  const [modalPlace, setModalPlace] = useState<NearbyPlace | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<NearbyFilterKey>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const hotelCenter = useMemo(
    () => resolveHotelCenter(hotelCenterProp, places),
    [hotelCenterProp, places],
  );

  const typeLabelFn = useCallback(
    (type: NearbyPlaceType) => getNearbyTypeLabel(s, type),
    [s],
  );

  const filteredPlaces = useMemo(() => {
    const filtered = filterNearbyPlaces(places, typeFilter, searchQuery, typeLabelFn);
    return sortPlacesByProximity(filtered, hotelCenter, locale);
  }, [places, typeFilter, searchQuery, typeLabelFn, hotelCenter, locale]);

  const mapPlace = previewPlace;

  const availableTypes = useMemo(
    () => NEARBY_TYPE_ORDER.filter((type) => places.some((p) => p.type === type)),
    [places],
  );

  const openPlace = useCallback((place: NearbyPlace) => {
    setPreviewPlace(place);
    setModalPlace(place);
  }, []);

  const closeModal = useCallback(() => {
    setModalPlace(null);
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [filterOpen]);

  const filterActive = typeFilter !== "all";

  return (
    <>
      <article className={cn(guestFramedLight, className)} aria-label={s.nearbySection}>
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-teal-500" strokeWidth={1.75} />
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              {s.nearbySection}
            </p>
          </div>
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-300"
            title={t.nearbyTapHint}
            aria-label={t.nearbyTapHint}
          >
            <Info className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </div>

        <div className="space-y-2 p-2">
          <GuestNearbyMapEmbed
            hotelCenter={hotelCenter}
            hotelLabel={hotelLabel}
            selectedPlace={mapPlace}
            mapUnavailableLabel={t.nearbyMapUnavailable}
            hotelPinLabel={t.nearbyHotelLabel}
            height={188}
          />

          <div ref={filterRef} className="relative">
            <div className="flex items-center gap-1.5 rounded-xl bg-zinc-50 px-2.5 py-1.5 ring-1 ring-zinc-100">
              <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.nearbySearchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[12px] text-zinc-800 outline-none placeholder:text-zinc-400"
                aria-label={t.nearbySearchPlaceholder}
              />
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={cn(
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  filterActive || filterOpen
                    ? "bg-teal-50 text-teal-700"
                    : "text-zinc-400 hover:bg-white hover:text-zinc-600",
                )}
                aria-label={t.nearbyFilterAll}
                aria-expanded={filterOpen}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {filterActive && (
                  <span className="absolute end-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-teal-500" />
                )}
              </button>
            </div>

            {filterOpen && (
              <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("all");
                    setFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-start text-[12px] transition-colors hover:bg-zinc-50",
                    typeFilter === "all" ? "font-semibold text-teal-700" : "text-zinc-700",
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100">
                    <MapPin className="h-3 w-3 text-zinc-500" />
                  </span>
                  <span className="flex-1">{t.nearbyFilterAll}</span>
                  {typeFilter === "all" && <Check className="h-3.5 w-3.5 text-teal-600" />}
                </button>
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setTypeFilter(type);
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 border-t border-zinc-50 px-3 py-2 text-start text-[12px] transition-colors hover:bg-zinc-50",
                      typeFilter === type ? "font-semibold text-teal-700" : "text-zinc-700",
                    )}
                  >
                    <NearbyPlaceTypeIcon type={type} size="sm" className="!h-6 !w-6 !rounded-md" />
                    <span className="flex-1">{getNearbyTypeLabel(s, type)}</span>
                    {typeFilter === type && <Check className="h-3.5 w-3.5 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="mb-1 flex items-center justify-between gap-2 px-0.5">
              <h3 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                <Navigation className="h-3 w-3 text-teal-500" strokeWidth={2} />
                {t.nearbyNearestTitle}
              </h3>
              <span className="text-[9px] font-medium text-zinc-400">
                {tFmt(t.nearbyViewAll, { count: String(filteredPlaces.length) })}
              </span>
            </div>

            <div className="max-h-[220px] space-y-0.5 overflow-y-auto overscroll-contain rounded-xl bg-zinc-50/80 p-1 ring-1 ring-zinc-100">
              {filteredPlaces.length === 0 ? (
                <div className="flex flex-col items-center px-2 py-5 text-center">
                  <MapPin className="h-6 w-6 text-zinc-300" strokeWidth={1.5} />
                  <p className="mt-1.5 text-[11px] leading-snug text-zinc-500">
                    {searchQuery || filterActive ? t.nearbyNoResults : t.nearbyEmptyPlaces}
                  </p>
                </div>
              ) : (
                filteredPlaces.map((place) => (
                  <GuestNearbyPlaceRow
                    key={place.id ?? place.name}
                    place={place}
                    active={previewPlace?.id === place.id}
                    onOpen={openPlace}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </article>

      <GuestPremiumSheet
        open={modalPlace != null}
        onOpenChange={(next) => {
          if (!next) closeModal();
        }}
        placement="center"
        ariaLabel={modalPlace?.name ?? s.nearbySection}
        className="max-h-[min(88dvh,640px)]"
      >
        {modalPlace && (
          <NearbyPlaceDetail place={modalPlace} s={s} guestOrigin={hotelCenter} />
        )}
      </GuestPremiumSheet>
    </>
  );
}
