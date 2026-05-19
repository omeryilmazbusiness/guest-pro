/**
 * GuestSearchFilterBar — minimal search + filter dropdown for guest list.
 */

import { Search, X, SlidersHorizontal, Check, DoorOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { StayStatus } from "@/lib/stays";
import type { StaffTranslations } from "@/lib/staff-i18n";

interface GuestSearchFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  roomFilter: string;
  onRoomChange: (v: string) => void;
  rooms: string[];
  statusFilter: StayStatus | "all";
  onStatusChange: (v: StayStatus | "all") => void;
  statusCounts: Record<"active" | "upcoming" | "expired" | "no_dates", number>;
  t: StaffTranslations;
}

export function GuestSearchFilterBar({
  search,
  onSearchChange,
  roomFilter,
  onRoomChange,
  rooms,
  statusFilter,
  onStatusChange,
  statusCounts,
  t,
}: GuestSearchFilterBarProps) {
  const hasRoomFilter = roomFilter !== "__all__";
  const hasStatusFilter = statusFilter !== "all";
  const isFiltered = hasRoomFilter || hasStatusFilter;

  const showStatusSection =
    statusCounts.upcoming > 0 || statusCounts.expired > 0;

  const statusOptions: {
    value: StayStatus | "all";
    label: string;
    count?: number;
    visible: boolean;
  }[] = [
    { value: "all", label: t.statusAll, visible: true },
    { value: "active", label: t.statusActive, count: statusCounts.active, visible: true },
    {
      value: "upcoming",
      label: t.statusUpcoming,
      count: statusCounts.upcoming,
      visible: statusCounts.upcoming > 0,
    },
    {
      value: "expired",
      label: t.statusExpired,
      count: statusCounts.expired,
      visible: statusCounts.expired > 0,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          data-testid="input-search"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-xl border-zinc-100 bg-white pl-10 pr-[4.25rem] text-sm shadow-sm focus-visible:ring-zinc-900"
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:text-zinc-700"
              aria-label={t.clearSearch}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "relative rounded-lg p-2 transition-all touch-manipulation",
                  isFiltered
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700",
                )}
                aria-label={t.filterGuests}
                title={t.filterGuests}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {isFiltered && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-[min(70dvh,22rem)] w-56 overflow-y-auto rounded-xl border-zinc-100 shadow-xl"
            >
              {rooms.length > 0 && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <DoorOpen className="h-3.5 w-3.5" />
                    {t.filterByRoom}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onRoomChange("__all__")}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg"
                  >
                    <span className="text-sm">{t.allRooms}</span>
                    {roomFilter === "__all__" && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    )}
                  </DropdownMenuItem>
                  {rooms.map((r) => (
                    <DropdownMenuItem
                      key={r}
                      onClick={() => onRoomChange(r)}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg"
                    >
                      <span className="font-mono text-sm font-medium">
                        {t.room} {r}
                      </span>
                      {roomFilter === r && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {showStatusSection && (
                <>
                  {rooms.length > 0 && <DropdownMenuSeparator className="my-1" />}
                  <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {t.filterByStatus}
                  </DropdownMenuLabel>
                  {statusOptions
                    .filter((o) => o.visible)
                    .map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => onStatusChange(opt.value)}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-lg"
                      >
                        <span className="text-sm">{opt.label}</span>
                        <span className="flex items-center gap-2">
                          {opt.count !== undefined && opt.count > 0 && (
                            <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                              {opt.count}
                            </span>
                          )}
                          {statusFilter === opt.value && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                          )}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isFiltered && (
        <div className="flex flex-wrap gap-1.5">
          {hasRoomFilter && (
            <button
              type="button"
              onClick={() => onRoomChange("__all__")}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600"
            >
              {t.room} {roomFilter}
              <X className="h-3 w-3" />
            </button>
          )}
          {hasStatusFilter && (
            <button
              type="button"
              onClick={() => onStatusChange("all")}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600"
            >
              {statusOptions.find((o) => o.value === statusFilter)?.label}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
