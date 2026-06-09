import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  MapPin,
  ChevronRight,
  Navigation,
  Building2,
  X,
  Search,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import { tFmt, type GuestTranslations } from "@/lib/i18n";
import type { WelcomingStrings } from "@/lib/welcoming/hotel-content";
import type { NearbyPlace, PlaceCoords } from "@/lib/welcoming/types";
import { resolveHotelCenter, sortPlacesByProximity } from "@/lib/nearby/nearby-distance";
import {
  NEARBY_TYPE_ORDER,
  NEARBY_TYPE_META,
  getNearbyTypeLabel,
  type NearbyPlaceType,
} from "@/lib/welcoming/nearby-place-meta";
import { filterNearbyPlaces, type NearbyFilterKey } from "@/lib/nearby/nearby-filter";
import { NearbyPlaceTypeIcon } from "@/components/welcoming/NearbyPlaceTypeIcon";
import { NearbyDialogShell } from "@/components/welcoming/NearbyDialogShell";
import { NearbyPlaceDetail } from "@/components/welcoming/NearbyPlaceDetail";
import { GuestNearbyMapEmbed } from "@/components/guest/nearby/GuestNearbyMapEmbed";

interface GuestNearbyExplorerProps {
  places: NearbyPlace[];
  hotelCenter: PlaceCoords | null;
  hotelLabel?: string | null;
  s: WelcomingStrings;
  t: GuestTranslations;
  locale?: string;
  className?: string;
}

function NearestRow({
  place,
  active,
  onSelect,
}: {
  place: NearbyPlace;
  active: boolean;
  onSelect: (place: NearbyPlace) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-start transition-all active:scale-[0.99]",
        active
          ? "border-teal-200/90 bg-white shadow-md ring-1 ring-teal-500/20"
          : "border-transparent bg-white/95 hover:border-zinc-200/80 hover:bg-white hover:shadow-sm",
      )}
    >
      <NearbyPlaceTypeIcon type={place.type} size="sm" />
      <span className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-zinc-900">{place.name}</p>
        {place.distance !== "—" && (
          <p className="text-[10px] font-medium text-zinc-400">{place.distance}</p>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-teal-600" />
    </button>
  );
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
      <article
        className={cn(
          dash.lightCard,
          "w-full overflow-hidden border border-teal-100/70 bg-gradient-to-br from-white via-teal-50/20 to-violet-50/30 shadow-[0_12px_40px_-16px_rgba(13,148,136,0.35)]",
          className,
        )}
        aria-label={s.nearbySection}
      >
        <div className="relative overflow-hidden border-b border-white/60 px-4 pb-3.5 pt-4">
          <div
            className="pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-teal-200/40 to-violet-200/30 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start gap-2.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-100/80 to-white shadow-sm">
              <MapPin className="h-[19px] w-[19px] text-teal-600" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <p className="text-[16px] font-bold leading-snug tracking-tight text-zinc-900">
                {s.nearbySection}
              </p>
              <p className="mt-0.5 text-[12px] text-zinc-500">{t.nearbyTapHint}</p>
            </span>
            {hotelCenter && (
              <span className="flex items-center gap-1 rounded-full border border-teal-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-teal-800 shadow-sm">
                <Building2 className="h-3 w-3" />
                {t.nearbyHotelLabel}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          <GuestNearbyMapEmbed
            hotelCenter={hotelCenter}
            hotelLabel={hotelLabel}
            selectedPlace={mapPlace}
            mapUnavailableLabel={t.nearbyMapUnavailable}
            hotelPinLabel={t.nearbyHotelLabel}
          />

          <div ref={filterRef} className="relative">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.nearbySearchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400"
                aria-label={t.nearbySearchPlaceholder}
              />
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                  filterActive || filterOpen
                    ? "bg-teal-50 text-teal-700"
                    : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600",
                )}
                aria-label={t.nearbyFilterAll}
                aria-expanded={filterOpen}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {filterActive && (
                  <span className="absolute end-1 top-1 h-1.5 w-1.5 rounded-full bg-teal-500" />
                )}
              </button>
            </div>

            {filterOpen && (
              <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter("all");
                    setFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-[13px] transition-colors hover:bg-zinc-50",
                    typeFilter === "all" ? "font-semibold text-teal-700" : "text-zinc-700",
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                  </span>
                  <span className="flex-1">{t.nearbyFilterAll}</span>
                  {typeFilter === "all" && <Check className="h-4 w-4 text-teal-600" />}
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
                      "flex w-full items-center gap-2.5 border-t border-zinc-50 px-3.5 py-2.5 text-start text-[13px] transition-colors hover:bg-zinc-50",
                      typeFilter === type ? "font-semibold text-teal-700" : "text-zinc-700",
                    )}
                  >
                    <NearbyPlaceTypeIcon type={type} size="sm" className="!h-7 !w-7 !rounded-lg" />
                    <span className="flex-1">{getNearbyTypeLabel(s, type)}</span>
                    {typeFilter === type && <Check className="h-4 w-4 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {availableTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter((prev) => (prev === type ? "all" : type))}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all",
                    typeFilter === type
                      ? NEARBY_TYPE_META[type].chipActive
                      : NEARBY_TYPE_META[type].chipIdle,
                  )}
                >
                  <NearbyPlaceTypeIcon type={type} size="sm" className="!h-4 !w-4 !rounded-sm" />
                  {getNearbyTypeLabel(s, type)}
                </button>
              ))}
            </div>
          )}

          <div className="flex min-h-0 flex-col">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-800">
                <Navigation className="h-3.5 w-3.5 text-teal-600" strokeWidth={2} />
                {t.nearbyNearestTitle}
              </h3>
              <span className="text-[10px] font-medium text-zinc-400">
                {tFmt(t.nearbyViewAll, { count: String(filteredPlaces.length) })}
              </span>
            </div>

            <div className="max-h-[280px] min-h-[160px] space-y-1 overflow-y-auto overscroll-contain rounded-2xl border border-zinc-100/80 bg-white/70 p-1.5 backdrop-blur-sm">
              {filteredPlaces.length === 0 ? (
                <p className="px-3 py-8 text-center text-[12px] leading-relaxed text-zinc-500">
                  {searchQuery || filterActive ? t.nearbyNoResults : t.nearbyEmptyPlaces}
                </p>
              ) : (
                filteredPlaces.map((place) => (
                  <NearestRow
                    key={place.id ?? place.name}
                    place={place}
                    active={previewPlace?.id === place.id}
                    onSelect={openPlace}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </article>

      <NearbyDialogShell
        open={modalPlace != null}
        onClose={closeModal}
        onEscape={closeModal}
        ariaLabel={modalPlace?.name ?? s.nearbySection}
        closeLabel={t.cancel}
      >
        {modalPlace && (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="absolute end-3 top-3 z-10">
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-500 shadow-sm backdrop-blur transition-colors hover:bg-zinc-100"
                aria-label={t.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NearbyPlaceDetail place={modalPlace} s={s} guestOrigin={hotelCenter} />
          </div>
        )}
      </NearbyDialogShell>
    </>
  );
}
