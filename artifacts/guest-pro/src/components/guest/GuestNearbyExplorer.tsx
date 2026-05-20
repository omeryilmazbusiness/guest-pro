import { useState, useMemo, useCallback } from "react";
import { MapPin, Search, ChevronRight, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { dash } from "@/lib/guest-dashboard-ui";
import { tFmt, type GuestTranslations } from "@/lib/i18n";
import type { WelcomingStrings } from "@/lib/welcoming/hotel-content";
import type { NearbyPlace } from "@/lib/welcoming/types";
import {
  NEARBY_TYPE_META,
  NEARBY_TYPE_ORDER,
  getNearbyTypeLabel,
  type NearbyPlaceType,
} from "@/lib/welcoming/nearby-place-meta";
import { NearbyPlaceTypeIcon } from "@/components/welcoming/NearbyPlaceTypeIcon";
import { NearbyDialogShell } from "@/components/welcoming/NearbyDialogShell";
import { NearbyPlaceDetail } from "@/components/welcoming/NearbyPlaceDetail";

type FilterKey = "all" | NearbyPlaceType;
type ModalView = { mode: "list" } | { mode: "detail"; place: NearbyPlace };

interface GuestNearbyExplorerProps {
  places: NearbyPlace[];
  s: WelcomingStrings;
  t: GuestTranslations;
  className?: string;
}

function PlaceRow({
  place,
  s,
  onSelect,
}: {
  place: NearbyPlace;
  s: WelcomingStrings;
  onSelect: (place: NearbyPlace) => void;
}) {
  const typeLabel = getNearbyTypeLabel(s, place.type);
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className="group flex w-full items-center gap-2.5 rounded-xl border border-zinc-100 bg-white px-3 py-2.5 text-start transition-all hover:border-zinc-200 hover:shadow-sm active:scale-[0.99]"
    >
      <NearbyPlaceTypeIcon type={place.type} size="sm" />
      <span className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold leading-snug text-zinc-900">{place.name}</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">{typeLabel}</p>
      </span>
      <span className="shrink-0 text-[10px] font-semibold text-zinc-500 rounded-md border border-zinc-100 bg-zinc-50 px-1.5 py-0.5">
        {place.distance}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-500" />
    </button>
  );
}

export function GuestNearbyExplorer({ places, s, t, className }: GuestNearbyExplorerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ModalView>({ mode: "list" });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const preview = places.slice(0, 2);

  const filteredPlaces = useMemo(() => {
    let list = places;
    if (filter !== "all") {
      list = list.filter((p) => p.type === filter);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const typeLabel = getNearbyTypeLabel(s, p.type).toLowerCase();
      return p.name.toLowerCase().includes(q) || typeLabel.includes(q);
    });
  }, [places, filter, query, s]);

  const openList = useCallback(() => {
    setQuery("");
    setFilter("all");
    setView({ mode: "list" });
    setOpen(true);
  }, []);

  const openDetail = useCallback((place: NearbyPlace) => {
    setView({ mode: "detail", place });
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery("");
    setFilter("all");
    setView({ mode: "list" });
  }, []);

  const backToList = useCallback(() => {
    setView({ mode: "list" });
  }, []);

  const handleEscape = useCallback(() => {
    if (view.mode === "detail") backToList();
    else closeModal();
  }, [view.mode, backToList, closeModal]);

  const filterChips: { key: FilterKey; label: string }[] = [
    { key: "all", label: t.nearbyFilterAll },
    ...NEARBY_TYPE_ORDER.filter((type) => places.some((p) => p.type === type)).map((type) => ({
      key: type as FilterKey,
      label: getNearbyTypeLabel(s, type),
    })),
  ];

  const isDetail = view.mode === "detail";

  return (
    <>
      <article
        className={cn(
          dash.lightCard,
          "w-full overflow-hidden bg-gradient-to-br from-white via-white to-teal-50/30",
          open && "ring-2 ring-teal-500/20 border-teal-200/60",
          className,
        )}
        aria-label={s.nearbySection}
      >
        <button
          type="button"
          onClick={openList}
          className="flex w-full items-start gap-2.5 border-b border-zinc-100/80 px-3.5 pt-3 pb-2 text-start transition-colors hover:bg-zinc-50/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50">
            <MapPin className="h-4 w-4 text-teal-600" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1 pt-0.5">
            <p className="text-[14px] font-semibold leading-snug text-zinc-900">{s.nearbySection}</p>
            <p className="mt-0.5 text-[12px] text-zinc-500">{t.nearbyTapHint}</p>
          </span>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
        </button>

        <div className="space-y-1.5 p-2">
          {preview.map((place) => (
            <button
              key={place.name}
              type="button"
              onClick={() => openDetail(place)}
              className="flex w-full items-center gap-2 rounded-lg bg-zinc-50/80 px-2 py-1.5 text-start transition-colors hover:bg-white hover:shadow-sm active:scale-[0.99]"
            >
              <NearbyPlaceTypeIcon type={place.type} size="sm" />
              <span className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-zinc-800">{place.name}</p>
                <p className="text-[10px] text-zinc-400">{getNearbyTypeLabel(s, place.type)}</p>
              </span>
              <span className="text-[10px] font-medium text-zinc-400">{place.distance}</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            </button>
          ))}
          <button
            type="button"
            onClick={openList}
            className="flex w-full items-center justify-center gap-1 pt-0.5 text-[12px] font-semibold text-teal-700 hover:text-teal-800"
          >
            {tFmt(t.nearbyViewAll, { count: String(places.length) })}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </article>

      <NearbyDialogShell
        open={open}
        onClose={closeModal}
        onEscape={handleEscape}
        ariaLabel={isDetail ? view.place.name : s.nearbySection}
        closeLabel={t.cancel}
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2.5">
            {isDetail ? (
              <button
                type="button"
                onClick={backToList}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-teal-700 transition-colors hover:bg-teal-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.nearbyBackToList}
              </button>
            ) : (
              <div className="min-w-0 flex-1 ps-1">
                <h2 className="text-[16px] font-semibold tracking-tight text-zinc-900">
                  {s.nearbySection}
                </h2>
                <p className="text-[11px] text-zinc-500">
                  {tFmt(t.nearbyViewAll, { count: String(places.length) })}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={closeModal}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-100"
              aria-label={t.cancel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isDetail ? (
            <NearbyPlaceDetail key={view.place.name} place={view.place} s={s} />
          ) : (
            <>
              <div className="shrink-0 space-y-2.5 border-b border-zinc-50 px-4 py-3">
                <label className="relative block">
                  <Search
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400",
                      typeof document !== "undefined" && document.documentElement.dir === "rtl"
                        ? "right-3"
                        : "left-3",
                    )}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.nearbySearchPlaceholder}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 ps-9 pe-3 text-[14px] text-zinc-900 placeholder:text-zinc-400 focus:border-teal-300/60 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
                  />
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {filterChips.map((chip) => {
                    const active = filter === chip.key;
                    const meta =
                      chip.key === "all" ? null : NEARBY_TYPE_META[chip.key as NearbyPlaceType];
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setFilter(chip.key)}
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all duration-200",
                          active
                            ? meta
                              ? meta.chipActive
                              : "bg-zinc-900 text-white border-zinc-900"
                            : meta
                              ? meta.chipIdle
                              : "bg-white text-zinc-600 border-zinc-200",
                        )}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-4 py-3">
                {filteredPlaces.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-zinc-500">{t.nearbyNoResults}</p>
                ) : (
                  filteredPlaces.map((place) => (
                    <PlaceRow
                      key={place.name}
                      place={place}
                      s={s}
                      onSelect={(p) => setView({ mode: "detail", place: p })}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </NearbyDialogShell>
    </>
  );
}
