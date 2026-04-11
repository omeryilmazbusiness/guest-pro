/**
 * Manager / Staff Dashboard
 *
 * Route: /manager
 * Roles: manager (full access) | personnel (create + view + edit + renew, no delete)
 *
 * Layout (top-to-bottom):
 *   ┌─────────────────────────────────────┐
 *   │ sticky header (56px)  z-20 top-0    │
 *   ├─────────────────────────────────────┤
 *   │ sticky rooms filter   z-10 top-14   │ ← only when rooms tab active
 *   │ (search + All / In use / Empty)     │
 *   ├─────────────────────────────────────┤
 *   │ scrollable main                     │
 *   │   GuestsOverviewCard (both roles)   │ ← presence donut + stats
 *   │   tab switcher                      │
 *   │   guests list  OR  rooms grid       │
 *   └─────────────────────────────────────┘
 *
 * Architecture — this page owns only:
 *   - layout composition and state orchestration
 *   - role-aware rendering decisions
 *   - mutation dispatch
 *
 * Domain logic lives in dedicated lib modules:
 *   src/lib/guests.ts           — filterGuests, extractRoomNumbers
 *   src/lib/rooms.ts            — aggregateRooms, filterRooms
 *   src/lib/tracking-summary.ts — computeTrackingSummary
 *   src/lib/permissions.ts      — role/capability checks
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  LogOut,
  Search,
  Loader2,
  Users,
  DoorOpen,
  Bell,
  X,
  Settings,
} from "lucide-react";
import {
  useListGuests,
  useLogout,
  useUpdateGuest,
  useDeleteGuest,
  useRenewGuestKey,
  getListGuestsQueryKey,
  type Guest,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { isStaffRole, can, Permission, roleLabel } from "@/lib/permissions";
import { filterGuests, extractRoomNumbers, countByStatus } from "@/lib/guests";
import { aggregateRooms, filterRooms } from "@/lib/rooms";
import { type StayStatus } from "@/lib/stays";
import { GuestProLogo } from "@/components/GuestProLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestCard } from "@/components/manager/GuestCard";
import { RoomCard } from "@/components/manager/RoomCard";
import { GuestEditModal } from "@/components/manager/GuestEditModal";
import { GuestDeleteDialog } from "@/components/manager/GuestDeleteDialog";
import { GuestHandoffModal, type HandoffData } from "@/components/GuestHandoffModal";
import { getGuestPresences, type TrackingStatus } from "@/lib/tracking";
import { computeTrackingSummary } from "@/lib/tracking-summary";
import { GuestsOverviewCard } from "@/components/manager/GuestsOverviewCard";
import { StaffRequestsBoard } from "@/components/manager/StaffRequestsBoard";

// ─── Types ────────────────────────────────────────────────────────────────────

type DashboardTab = "guests" | "rooms" | "requests";

// ─── Tab switcher ─────────────────────────────────────────────────────────────

function DashboardTabs({
  active,
  onChange,
  guestCount,
  roomCount,
  requestCount,
}: {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  guestCount: number;
  roomCount: number;
  requestCount: number;
}) {
  const TABS: { key: DashboardTab; label: string; icon: React.FC<{ className?: string }>; count: number }[] = [
    { key: "guests", label: "Guests", icon: Users, count: guestCount },
    { key: "rooms", label: "Rooms", icon: DoorOpen, count: roomCount },
    { key: "requests", label: "Requests", icon: Bell, count: requestCount },
  ];

  return (
    <div className="flex bg-zinc-100 rounded-2xl p-1 gap-1">
      {TABS.map(({ key, label, icon: Icon, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[13px] font-semibold transition-all touch-manipulation ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
            aria-selected={isActive}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count > 0 && (
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                  isActive ? "bg-zinc-100 text-zinc-600" : "bg-zinc-200 text-zinc-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sticky guest filter bar ──────────────────────────────────────────────────
//
// Rendered as a sibling of <main>, sticky at top-14 (below the 56px header).
// Contains search, room dropdown, and stay-status filter chips.
// backdrop-blur + border-b provide visual elevation when scrolled.

function StickyGuestFilterBar({
  search,
  onSearchChange,
  roomFilter,
  onRoomChange,
  rooms,
  statusFilter,
  onStatusChange,
  statusCounts,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  roomFilter: string;
  onRoomChange: (v: string) => void;
  rooms: string[];
  statusFilter: StayStatus | "all";
  onStatusChange: (v: StayStatus | "all") => void;
  statusCounts: Record<"active" | "upcoming" | "expired" | "no_dates", number>;
}) {
  const STATUS_OPTIONS: { value: StayStatus | "all"; label: string; count?: number }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "upcoming", label: "Upcoming", count: statusCounts.upcoming },
    { value: "expired", label: "Expired", count: statusCounts.expired },
  ];

  const hasAnyStatusFilter = statusCounts.upcoming > 0 || statusCounts.expired > 0;

  return (
    <div className="sticky top-14 z-10 bg-zinc-50/95 backdrop-blur-sm border-b border-zinc-200/60">
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 space-y-2">
        {/* Search + room dropdown row */}
        <div className="flex gap-2 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              data-testid="input-search"
              placeholder="Name, room, or key…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-8 h-10 rounded-2xl bg-white border-zinc-200 focus-visible:ring-zinc-900 text-sm shadow-sm"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {rooms.length > 0 && (
            <Select value={roomFilter} onValueChange={onRoomChange}>
              <SelectTrigger className="h-10 w-auto rounded-2xl border-zinc-200 bg-white text-sm font-medium focus:ring-zinc-900 px-3 gap-1.5 shrink-0 shadow-sm">
                <DoorOpen className="w-4 h-4 text-zinc-400" />
                <SelectValue placeholder="Room" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-200 shadow-xl">
                <SelectItem value="__all__" className="rounded-xl text-sm font-medium">
                  All Rooms
                </SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r} value={r} className="rounded-xl text-sm font-mono font-medium">
                    Room {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Status chip row — only shown when non-default statuses exist */}
        {hasAnyStatusFilter && (
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {STATUS_OPTIONS.filter(
              (o) =>
                o.value === "all" ||
                o.value === "active" ||
                (o.value === "upcoming" && statusCounts.upcoming > 0) ||
                (o.value === "expired" && statusCounts.expired > 0)
            ).map((opt) => {
              const isActive = statusFilter === opt.value;
              const chipStyle =
                isActive
                  ? opt.value === "expired"
                    ? "bg-red-700 text-white border-red-700"
                    : opt.value === "upcoming"
                      ? "bg-sky-700 text-white border-sky-700"
                      : "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300";
              return (
                <button
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all touch-manipulation shrink-0 ${chipStyle}`}
                >
                  {opt.label}
                  {opt.count !== undefined && opt.count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1 py-0 rounded ${
                        isActive ? "bg-white/20 text-inherit" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sticky rooms filter bar ──────────────────────────────────────────────────
//
// Rendered as a sibling of <main>, sticky at top-14 (below the 56px header).
// Only shows room number search — all derived rooms are occupied (no status filter needed).

function StickyRoomFilterBar({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="sticky top-14 z-10 bg-zinc-50/95 backdrop-blur-sm border-b border-zinc-200/60">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <Input
            placeholder="Search room number…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-8 h-10 rounded-2xl bg-white border-zinc-200 focus-visible:ring-zinc-900 text-sm shadow-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5"
              aria-label="Clear room search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function GuestCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
    </div>
  );
}

function RoomCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 flex flex-col gap-3"
      style={{ aspectRatio: "1 / 1.1" }}
    >
      <div className="flex justify-between">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-14 h-6 rounded-lg" />
      </div>
      <div className="mt-auto space-y-1.5">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  // ── Data
  const { data: guests, isLoading } = useListGuests({
    query: { enabled: isAuthenticated && isStaffRole(user?.role) },
  });

  // ── Presence data (tracking) — refetch every 60 s while dashboard is open.
  const { data: presences, isFetching: presencesFetching } = useQuery({
    queryKey: ["tracking", "presences"],
    queryFn: getGuestPresences,
    enabled: isAuthenticated && isStaffRole(user?.role),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Build guestId → TrackingStatus lookup for O(1) card renders.
  const presenceMap = useMemo<Map<number, TrackingStatus>>(() => {
    if (!presences?.length) return new Map();
    const map = new Map<number, TrackingStatus>();
    for (const p of presences) {
      map.set(p.guestId, p.status as TrackingStatus);
    }
    return map;
  }, [presences]);

  // Compute tracking summary — source of truth for the overview card.
  const trackingSummary = useMemo(
    () => computeTrackingSummary(guests?.map((g) => g.id) ?? [], presenceMap),
    [guests, presenceMap]
  );

  // ── Mutations
  const updateGuestMutation = useUpdateGuest();
  const deleteGuestMutation = useDeleteGuest();
  const renewKeyMutation = useRenewGuestKey();

  // ── Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("guests");

  // ── Guest filters
  const [guestSearch, setGuestSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState<StayStatus | "all">("all");

  // ── Room filters
  const [roomSearch, setRoomSearch] = useState("");

  // ── Modals
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);
  const [handoff, setHandoff] = useState<HandoffData | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);

  // ── Auth guard
  useEffect(() => {
    if (!isAuthenticated) setLocation("/");
    else if (user && !isStaffRole(user.role)) setLocation("/guest");
  }, [isAuthenticated, user, setLocation]);

  // ── Permissions
  const role = user?.role ?? "";
  const isManager = role === "manager";
  const canEdit = can(role, Permission.EDIT_GUEST);
  const canDelete = can(role, Permission.DELETE_GUEST);
  const canRenew = can(role, Permission.RENEW_GUEST_KEY);
  const canCreate = can(role, Permission.CREATE_GUEST);

  // ── Derived data (all from lib — no logic in page)
  const stats = useMemo(() => {
    if (!guests) return { total: 0, newToday: 0, roomsOccupied: 0 };
    const today = new Date().toDateString();
    const rooms = aggregateRooms(guests);
    return {
      total: guests.length,
      newToday: guests.filter((g) => new Date(g.createdAt).toDateString() === today).length,
      roomsOccupied: rooms.filter((r) => r.isOccupied).length,
    };
  }, [guests]);

  const roomNumbers = useMemo(() => extractRoomNumbers(guests ?? []), [guests]);

  const statusCounts = useMemo(() => countByStatus(guests ?? []), [guests]);

  const filteredGuests = useMemo(
    () => filterGuests(guests ?? [], { search: guestSearch, roomNumber: roomFilter, status: statusFilter }),
    [guests, guestSearch, roomFilter, statusFilter]
  );

  const allRooms = useMemo(() => aggregateRooms(guests ?? []), [guests]);

  const filteredRooms = useMemo(
    () => filterRooms(allRooms, roomSearch),
    [allRooms, roomSearch]
  );

  const guestHasFilters = guestSearch.length > 0 || roomFilter !== "__all__" || statusFilter !== "all";
  const roomHasFilters = roomSearch.length > 0;

  // ── Handlers
  const invalidateGuests = useCallback(
    () => queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() }),
    [queryClient]
  );

  const handleRefreshTracking = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["tracking", "presences"] }),
    [queryClient]
  );

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success("Logged out");
  };

  const handleNavigateCreate = () => setLocation("/manager/guests/new");

  const handleEdit = async (
    id: number,
    data: {
      firstName: string;
      lastName: string;
      roomNumber: string;
      countryCode: string;
      checkInDate?: string;
      checkOutDate?: string;
    }
  ) => {
    await updateGuestMutation.mutateAsync(
      { id, data },
      {
        onSuccess: () => {
          toast.success("Guest updated");
          setEditingGuest(null);
          invalidateGuests();
        },
        onError: () => toast.error("Failed to update guest"),
      }
    );
  };

  const handleDelete = async (id: number) => {
    await deleteGuestMutation.mutateAsync(
      { id },
      {
        onSuccess: () => {
          toast.success("Guest removed");
          setDeletingGuest(null);
          invalidateGuests();
        },
        onError: () => toast.error("Failed to remove guest"),
      }
    );
  };

  const handleRenewKey = (guest: Guest) => {
    renewKeyMutation.mutate(
      { id: guest.id },
      {
        onSuccess: (res) => {
          invalidateGuests();
          setHandoff({
            firstName: res.guest.firstName,
            lastName: res.guest.lastName,
            roomNumber: res.guest.roomNumber,
            guestKey: res.guestKey,
            qrLoginUrl: res.qrLoginUrl,
            qrTokenExpiresAt: res.qrTokenExpiresAt,
          });
          setHandoffOpen(true);
          toast.success("Key renewed");
        },
        onError: () => toast.error("Failed to renew key"),
      }
    );
  };

  const clearGuestFilters = () => {
    setGuestSearch("");
    setRoomFilter("__all__");
    setStatusFilter("all");
  };
  const clearRoomFilters = () => {
    setRoomSearch("");
  };

  if (!isAuthenticated || !isStaffRole(user?.role)) return null;

  return (
    <div className="min-h-[100dvh] bg-zinc-50/60">

      {/* ── Sticky header (56px) ── */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center shrink-0">
              <GuestProLogo variant="header" className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-serif text-base font-medium text-zinc-900 block leading-none">
                Guest Pro
              </span>
              <span className="text-[10px] text-zinc-400 font-medium leading-none truncate block max-w-[160px]">
                {roleLabel(user.role)} · {user.firstName} {user.lastName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canCreate && (
              <Button
                data-testid="button-create-guest-desktop"
                onClick={handleNavigateCreate}
                size="sm"
                className="h-8 px-3.5 rounded-xl text-[13px] font-medium shadow-sm shadow-zinc-900/10 hidden sm:flex"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Guest
              </Button>
            )}
            {isManager && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/manager/settings")}
                className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 touch-manipulation"
                aria-label="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 touch-manipulation"
              aria-label="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Sticky filter bars — below header, tab-conditional ── */}
      {activeTab === "guests" && (
        <StickyGuestFilterBar
          search={guestSearch}
          onSearchChange={setGuestSearch}
          roomFilter={roomFilter}
          onRoomChange={setRoomFilter}
          rooms={roomNumbers}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusCounts={statusCounts}
        />
      )}
      {activeTab === "rooms" && (
        <StickyRoomFilterBar
          search={roomSearch}
          onSearchChange={setRoomSearch}
        />
      )}

      {/* ── Scrollable main content ── */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

        {/* ─── Premium presence overview card (both roles) ─── */}
        {!isLoading && (
          <GuestsOverviewCard
            summary={trackingSummary}
            isRefreshing={presencesFetching}
            onRefresh={handleRefreshTracking}
            managerStats={
              isManager
                ? {
                    total: stats.total,
                    newToday: stats.newToday,
                    roomsOccupied: stats.roomsOccupied,
                  }
                : undefined
            }
          />
        )}

        {/* Tab switcher */}
        <DashboardTabs
          active={activeTab}
          onChange={setActiveTab}
          guestCount={guests?.length ?? 0}
          roomCount={allRooms.length}
          requestCount={0}
        />

        {/* ══════════════════════════════════
            GUESTS TAB
        ══════════════════════════════════ */}
        {activeTab === "guests" && (
          <div className="space-y-3 animate-in fade-in duration-200">

            {/* Count + clear */}
            {!isLoading && guests && (guestHasFilters || guests.length > 0) && (
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-zinc-400 font-medium">
                  {filteredGuests.length === guests.length
                    ? `${guests.length} guest${guests.length !== 1 ? "s" : ""} · newest first`
                    : `${filteredGuests.length} of ${guests.length} guests`}
                </p>
                {guestHasFilters && (
                  <button
                    onClick={clearGuestFilters}
                    className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Guest list */}
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <GuestCardSkeleton key={i} />)
              ) : filteredGuests.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-2xl border border-zinc-100">
                  <Users className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                  {guests && guests.length > 0 ? (
                    <>
                      <p className="text-sm font-medium text-zinc-700 mb-1">No matches</p>
                      <p className="text-xs text-zinc-400 mb-4">
                        Try different search or room filter.
                      </p>
                      <button
                        onClick={clearGuestFilters}
                        className="text-xs text-zinc-500 underline underline-offset-2"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-zinc-700 mb-1">No guests yet</p>
                      <p className="text-xs text-zinc-400 mb-5">
                        Check in your first guest to get started.
                      </p>
                      {canCreate && (
                        <button
                          onClick={handleNavigateCreate}
                          className="inline-flex items-center gap-1.5 bg-zinc-900 text-white rounded-2xl px-5 py-2.5 text-sm font-medium active:scale-95 transition-all touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                          Check In Guest
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                filteredGuests.map((guest) => (
                  <GuestCard
                    key={guest.id}
                    guest={guest}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canRenew={canRenew}
                    onEdit={setEditingGuest}
                    onDelete={setDeletingGuest}
                    onRenew={handleRenewKey}
                    trackingStatus={presenceMap.get(guest.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            ROOMS TAB
            (filter bar is sticky above — not rendered here)
        ══════════════════════════════════ */}
        {activeTab === "rooms" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Result count */}
            {!isLoading && (
              <div className="px-1">
                <p className="text-xs text-zinc-400 font-medium">
                  {filteredRooms.length === allRooms.length
                    ? `${allRooms.length} room${allRooms.length !== 1 ? "s" : ""} occupied`
                    : `${filteredRooms.length} of ${allRooms.length} rooms`}
                </p>
              </div>
            )}

            {/* 2-column grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RoomCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-zinc-100">
                <DoorOpen className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                {allRooms.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-zinc-700 mb-1">No rooms match</p>
                    <p className="text-xs text-zinc-400 mb-4">
                      Try a different room number or filter.
                    </p>
                    <button
                      onClick={clearRoomFilters}
                      className="text-xs text-zinc-500 underline underline-offset-2"
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-zinc-700 mb-1">No rooms yet</p>
                    <p className="text-xs text-zinc-400">
                      Rooms appear automatically when guests are checked in.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredRooms.map((room) => (
                  <RoomCard key={room.roomNumber} room={room} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            REQUESTS TAB
        ══════════════════════════════════ */}
        {activeTab === "requests" && (
          <div className="animate-in fade-in duration-200">
            <StaffRequestsBoard presenceMap={presenceMap} />
          </div>
        )}

      </main>

      {/* ── Mobile FAB ── */}
      {canCreate && (
        <div className="fixed bottom-6 right-5 z-30 sm:hidden">
          <button
            data-testid="button-create-guest"
            onClick={handleNavigateCreate}
            className="flex items-center gap-2 bg-zinc-900 text-white rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl shadow-zinc-900/30 hover:bg-zinc-800 active:scale-95 transition-all touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            New Guest
          </button>
        </div>
      )}

      {/* ── Renew overlay ── */}
      {renewKeyMutation.isPending && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-2xl px-10 py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
            <p className="text-sm font-medium text-zinc-600">Renewing key…</p>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <GuestEditModal
        open={!!editingGuest}
        guest={editingGuest}
        onClose={() => setEditingGuest(null)}
        onSave={handleEdit}
        isSaving={updateGuestMutation.isPending}
      />
      <GuestDeleteDialog
        open={!!deletingGuest}
        guest={deletingGuest}
        onClose={() => setDeletingGuest(null)}
        onConfirm={handleDelete}
        isDeleting={deleteGuestMutation.isPending}
      />
      {handoff && (
        <GuestHandoffModal
          open={handoffOpen}
          data={handoff}
          onClose={() => {
            setHandoffOpen(false);
            setHandoff(null);
          }}
          onCreateAnother={() => {
            setHandoffOpen(false);
            setHandoff(null);
            setLocation("/manager/guests/new");
          }}
        />
      )}
    </div>
  );
}
