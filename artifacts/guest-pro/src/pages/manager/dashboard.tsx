/**
 * Manager / Staff Dashboard
 *
 * A single route (`/manager`) that renders a role-aware mobile-first
 * operations console. Two distinct personas:
 *
 *   MANAGER — full dashboard:
 *     horizontal stat chips → search + filters → guest list + all CRUD actions
 *
 *   PERSONNEL (Staff) — focused workspace:
 *     warm welcome card with prominent CTA → search → guest list (edit + renew only)
 *
 * Mobile-first decisions:
 *   • Stat chips scroll horizontally — no vertical card stack on phones
 *   • Guest cards are compact 2-line (~68px) — 5–6 visible without scrolling
 *   • FAB (floating action button) for "New Guest" — thumb-zone bottom-right on mobile
 *   • Header stays sticky + minimal — 56px, brand + role identity + logout only
 *   • Search / filter controls are full-width on mobile, side-by-side on sm+
 *   • Room filter uses Select (sheet-like behavior on iOS)
 *
 * Architecture:
 *   - GuestCard     → compact list item (new)
 *   - GuestEditModal      → edit dialog (existing)
 *   - GuestDeleteDialog   → delete confirmation (existing)
 *   - GuestHandoffModal   → key renewal result (existing, reused)
 *   - All state + mutations live here; components are presentation-only
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  LogOut,
  Search,
  Loader2,
  Users,
  CalendarPlus,
  BedDouble,
  DoorOpen,
  X,
  ChevronRight,
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
import { GuestEditModal } from "@/components/manager/GuestEditModal";
import { GuestDeleteDialog } from "@/components/manager/GuestDeleteDialog";
import { GuestHandoffModal, type HandoffData } from "@/components/GuestHandoffModal";

// ─── Horizontal stat chip ─────────────────────────────────────────────────────

interface StatChipProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

function StatChip({ icon, label, value }: StatChipProps) {
  return (
    <div className="flex items-center gap-3 bg-white border border-zinc-100 rounded-2xl px-4 py-3 shadow-sm shrink-0 min-w-[148px] snap-start">
      <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none mb-1">
          {label}
        </p>
        <p className="text-xl font-semibold text-zinc-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

// ─── Staff welcome section (personnel persona) ────────────────────────────────

interface StaffWelcomeSectionProps {
  firstName: string;
  onCreateGuest: () => void;
}

function StaffWelcomeSection({ firstName, onCreateGuest }: StaffWelcomeSectionProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-zinc-900 rounded-3xl px-6 py-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-zinc-400 text-xs font-medium mb-0.5">{greeting}</p>
        <h2 className="text-white font-serif text-lg font-medium leading-tight">
          {firstName}
        </h2>
        <p className="text-zinc-500 text-xs mt-1">Ready for check-ins</p>
      </div>
      <button
        data-testid="button-create-guest"
        onClick={onCreateGuest}
        className="flex items-center gap-2 bg-white text-zinc-900 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg active:scale-95 transition-transform touch-manipulation shrink-0"
      >
        <Plus className="w-4 h-4" />
        Check In Guest
      </button>
    </div>
  );
}

// ─── Manager overview section ─────────────────────────────────────────────────

interface ManagerOverviewProps {
  total: number;
  newToday: number;
  roomsOccupied: number;
  isLoading: boolean;
}

function ManagerOverview({ total, newToday, roomsOccupied, isLoading }: ManagerOverviewProps) {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory scrollbar-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <StatChip
        icon={<Users className="w-4 h-4 text-zinc-500" />}
        label="Total"
        value={isLoading ? "–" : total}
      />
      <StatChip
        icon={<CalendarPlus className="w-4 h-4 text-zinc-500" />}
        label="Today"
        value={isLoading ? "–" : newToday}
      />
      <StatChip
        icon={<BedDouble className="w-4 h-4 text-zinc-500" />}
        label="Rooms"
        value={isLoading ? "–" : roomsOccupied}
      />
    </div>
  );
}

// ─── Search + filter bar ──────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  roomFilter: string;
  onRoomChange: (v: string) => void;
  rooms: string[];
}

function FilterBar({ search, onSearchChange, roomFilter, onRoomChange, rooms }: FilterBarProps) {
  return (
    <div className="flex gap-2 items-stretch">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <Input
          data-testid="input-search"
          placeholder="Name, room, or key…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-9 h-11 rounded-2xl bg-white border-zinc-200 focus-visible:ring-zinc-900 text-sm"
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

      {/* Room filter — only shown if there are rooms */}
      {rooms.length > 0 && (
        <Select value={roomFilter} onValueChange={onRoomChange}>
          <SelectTrigger className="h-11 w-auto min-w-[44px] rounded-2xl border-zinc-200 bg-white text-sm font-medium focus:ring-zinc-900 px-3 gap-1.5 shrink-0">
            <DoorOpen className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">
              <SelectValue placeholder="Room" />
            </span>
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
  );
}

// ─── Guest list skeleton ──────────────────────────────────────────────────────

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

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  hasGuests: boolean;
  hasFilters: boolean;
  canCreate: boolean;
  onClearFilters: () => void;
  onCreateGuest: () => void;
}

function EmptyState({ hasGuests, hasFilters, canCreate, onClearFilters, onCreateGuest }: EmptyStateProps) {
  if (hasGuests && hasFilters) {
    return (
      <div className="text-center py-14 bg-white rounded-2xl border border-zinc-100">
        <Search className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-700 mb-1">No matches</p>
        <p className="text-xs text-zinc-400 mb-4">Try different search terms or room.</p>
        <button
          onClick={onClearFilters}
          className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900 touch-manipulation"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100">
      <Users className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
      <p className="text-sm font-medium text-zinc-700 mb-1">No guests yet</p>
      <p className="text-xs text-zinc-400 mb-6">Check in your first guest to get started.</p>
      {canCreate && (
        <button
          onClick={onCreateGuest}
          className="inline-flex items-center gap-1.5 bg-zinc-900 text-white rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-zinc-800 active:scale-95 transition-all touch-manipulation"
        >
          <Plus className="w-4 h-4" />
          Check In Guest
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  // ── Queries
  const { data: guests, isLoading } = useListGuests({
    query: { enabled: isAuthenticated && isStaffRole(user?.role) },
  });

  // ── Mutations
  const updateGuestMutation = useUpdateGuest();
  const deleteGuestMutation = useDeleteGuest();
  const renewKeyMutation = useRenewGuestKey();

  // ── UI state
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("__all__");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);
  const [handoff, setHandoff] = useState<HandoffData | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);

  // ── Auth guard
  useEffect(() => {
    if (!isAuthenticated) setLocation("/");
    else if (user && !isStaffRole(user.role)) setLocation("/guest");
  }, [isAuthenticated, user, setLocation]);

  // ── Role permissions
  const role = user?.role ?? "";
  const isManager = role === "manager";
  const canEdit = can(role, Permission.EDIT_GUEST);
  const canDelete = can(role, Permission.DELETE_GUEST);
  const canRenew = can(role, Permission.RENEW_GUEST_KEY);
  const canCreate = can(role, Permission.CREATE_GUEST);

  // ── Stats
  const stats = useMemo(() => {
    if (!guests) return { total: 0, newToday: 0, roomsOccupied: 0 };
    const today = new Date().toDateString();
    return {
      total: guests.length,
      newToday: guests.filter((g) => new Date(g.createdAt).toDateString() === today).length,
      roomsOccupied: new Set(guests.map((g) => g.roomNumber)).size,
    };
  }, [guests]);

  // ── Rooms for filter dropdown
  const rooms = useMemo(() => {
    if (!guests) return [];
    return [...new Set(guests.map((g) => g.roomNumber))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [guests]);

  // ── Filtered list
  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    const q = search.toLowerCase();
    return guests.filter((g) => {
      const matchesSearch =
        !q ||
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.roomNumber.toLowerCase().includes(q) ||
        (g.guestKey?.toLowerCase().includes(q) ?? false);
      const matchesRoom = roomFilter === "__all__" || g.roomNumber === roomFilter;
      return matchesSearch && matchesRoom;
    });
  }, [guests, search, roomFilter]);

  const hasFilters = search.length > 0 || roomFilter !== "__all__";
  const hasGuests = (guests?.length ?? 0) > 0;

  // ── Handlers
  const invalidateGuests = useCallback(
    () => queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() }),
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
    data: { firstName: string; lastName: string; roomNumber: string; countryCode: string }
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

  const clearFilters = () => { setSearch(""); setRoomFilter("__all__"); };

  if (!isAuthenticated || !isStaffRole(user?.role)) return null;

  const isRenewing = renewKeyMutation.isPending;

  return (
    <div className="min-h-[100dvh] bg-zinc-50/60">

      {/* ── Sticky header — 56px, minimal ── */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Brand */}
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

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Desktop "New Guest" — hidden on mobile (FAB handles it) */}
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

      {/* ── Page content ── */}
      <main className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

        {/* MANAGER: horizontal stat chips */}
        {isManager && (
          <ManagerOverview
            total={stats.total}
            newToday={stats.newToday}
            roomsOccupied={stats.roomsOccupied}
            isLoading={isLoading}
          />
        )}

        {/* STAFF: warm welcome + CTA */}
        {!isManager && canCreate && (
          <StaffWelcomeSection
            firstName={user.firstName}
            onCreateGuest={handleNavigateCreate}
          />
        )}

        {/* Search + room filter */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          roomFilter={roomFilter}
          onRoomChange={setRoomFilter}
          rooms={rooms}
        />

        {/* Result count */}
        {!isLoading && guests && (hasFilters || hasGuests) && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-zinc-400 font-medium">
              {filteredGuests.length === guests.length
                ? `${guests.length} guest${guests.length !== 1 ? "s" : ""}`
                : `${filteredGuests.length} of ${guests.length} guests`}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
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
            <EmptyState
              hasGuests={hasGuests}
              hasFilters={hasFilters}
              canCreate={canCreate}
              onClearFilters={clearFilters}
              onCreateGuest={handleNavigateCreate}
            />
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
              />
            ))
          )}
        </div>

        {/* Manager: link to see all if results are filtered */}
        {isManager && !isLoading && hasFilters && filteredGuests.length > 0 && (
          <button
            onClick={clearFilters}
            className="w-full flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 py-2 touch-manipulation"
          >
            Show all {guests?.length} guests
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </main>

      {/* ── Mobile FAB — New Guest (fixed bottom-right, hidden on sm+) ── */}
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

      {/* ── Renewing overlay ── */}
      {isRenewing && (
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
          onClose={() => { setHandoffOpen(false); setHandoff(null); }}
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
