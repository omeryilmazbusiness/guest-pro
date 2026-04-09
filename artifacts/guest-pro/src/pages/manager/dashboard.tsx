/**
 * Manager Dashboard
 *
 * The primary operational console for hotel staff.
 * Provides guest management (CRUD), key renewal, search, room filtering,
 * and KPI overview — role-aware throughout.
 *
 * Architecture:
 *  - This page owns layout, state, and mutation orchestration only
 *  - GuestEditModal / GuestDeleteDialog handle their own form/UI logic
 *  - GuestHandoffModal is reused for key renewal (same data shape)
 *  - All CRUD operations are funneled through dedicated API hooks
 *  - Permission checks via can() mirror server-side enforcement
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useListGuests,
  useLogout,
  useUpdateGuest,
  useDeleteGuest,
  useRenewGuestKey,
  getListGuestsQueryKey,
  type Guest,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  LogOut,
  Users,
  Search,
  DoorOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCcw,
  Copy,
  Check,
  ChevronDown,
  CalendarPlus,
  BedDouble,
} from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { isStaffRole, can, Permission, roleLabel } from "@/lib/permissions";
import { countryFlag } from "@/lib/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GuestEditModal } from "@/components/manager/GuestEditModal";
import { GuestDeleteDialog } from "@/components/manager/GuestDeleteDialog";
import { GuestHandoffModal, type HandoffData } from "@/components/GuestHandoffModal";

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-semibold text-zinc-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Guest Row ────────────────────────────────────────────────────────────────

interface GuestRowProps {
  guest: Guest;
  canEdit: boolean;
  canDelete: boolean;
  canRenew: boolean;
  onEdit: (g: Guest) => void;
  onDelete: (g: Guest) => void;
  onRenew: (g: Guest) => void;
}

function GuestRow({ guest, canEdit, canDelete, canRenew, onEdit, onDelete, onRenew }: GuestRowProps) {
  const [keyCopied, setKeyCopied] = useState(false);
  const initials = `${guest.firstName[0] ?? ""}${guest.lastName[0] ?? ""}`.toUpperCase();
  const createdDate = new Date(guest.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCopyKey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!guest.guestKey) return;
    try {
      await navigator.clipboard.writeText(guest.guestKey);
      setKeyCopied(true);
      toast.success("Guest key copied");
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div
      data-testid={`card-guest-${guest.id}`}
      className="group bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all duration-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      {/* Avatar + Identity */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-white font-serif">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-900 text-[15px]">
              {guest.firstName} {guest.lastName}
            </span>
            {guest.countryCode && (
              <span className="text-base leading-none" title={guest.countryCode}>
                {countryFlag(guest.countryCode)}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Checked in {createdDate}</p>
        </div>
      </div>

      {/* Room Badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        <DoorOpen className="w-3.5 h-3.5 text-zinc-400" />
        <Badge
          variant="secondary"
          className="bg-zinc-100 text-zinc-700 font-mono font-semibold text-[13px] px-2.5 py-0.5 rounded-lg border-0"
        >
          {guest.roomNumber}
        </Badge>
      </div>

      {/* Key + Copy */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="font-mono text-sm text-zinc-500 tracking-wider bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 min-w-[130px]">
          {guest.guestKey ? (
            <span className="text-zinc-700 font-medium">{guest.guestKey}</span>
          ) : (
            <span className="text-zinc-300">No active key</span>
          )}
        </div>
        {guest.guestKey && (
          <button
            onClick={handleCopyKey}
            className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-50 transition-colors shrink-0"
            aria-label="Copy guest key"
          >
            {keyCopied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
        )}
      </div>

      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 shrink-0"
            aria-label="Guest actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-2xl border-zinc-200 shadow-xl p-1.5">
          {canEdit && (
            <DropdownMenuItem
              onClick={() => onEdit(guest)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px]"
            >
              <Pencil className="w-3.5 h-3.5 text-zinc-500" />
              Edit Guest
            </DropdownMenuItem>
          )}
          {canRenew && (
            <DropdownMenuItem
              onClick={() => onRenew(guest)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px]"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-zinc-500" />
              Renew Key & QR
            </DropdownMenuItem>
          )}
          {guest.guestKey && (
            <DropdownMenuItem
              onClick={handleCopyKey}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px]"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
              Copy Guest Key
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator className="my-1 bg-zinc-100" />
              <DropdownMenuItem
                onClick={() => onDelete(guest)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Guest
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function GuestRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
      <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  // ─ Queries ─
  const { data: guests, isLoading } = useListGuests({
    query: { enabled: isAuthenticated && isStaffRole(user?.role) },
  });

  // ─ Mutations ─
  const updateGuestMutation = useUpdateGuest();
  const deleteGuestMutation = useDeleteGuest();
  const renewKeyMutation = useRenewGuestKey();

  // ─ UI State ─
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<string>("__all__");
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);
  const [handoff, setHandoff] = useState<HandoffData | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);

  // ─ Auth guard ─
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user && !isStaffRole(user.role)) {
      setLocation("/guest");
    }
  }, [isAuthenticated, user, setLocation]);

  // ─ Role permissions ─
  const role = user?.role ?? "";
  const canEdit = can(role, Permission.EDIT_GUEST);
  const canDelete = can(role, Permission.DELETE_GUEST);
  const canRenew = can(role, Permission.RENEW_GUEST_KEY);
  const canCreate = can(role, Permission.CREATE_GUEST);

  // ─ Stats ─
  const stats = useMemo(() => {
    if (!guests) return { total: 0, newToday: 0, roomsOccupied: 0 };
    const today = new Date().toDateString();
    return {
      total: guests.length,
      newToday: guests.filter((g) => new Date(g.createdAt).toDateString() === today).length,
      roomsOccupied: new Set(guests.map((g) => g.roomNumber)).size,
    };
  }, [guests]);

  // ─ Room list for filter ─
  const rooms = useMemo(() => {
    if (!guests) return [];
    return [...new Set(guests.map((g) => g.roomNumber))].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [guests]);

  // ─ Filtered + searched list ─
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

  // ─ Handlers ─

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success("Logged out");
  };

  const invalidateGuests = () =>
    queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });

  const handleEdit = async (id: number, data: { firstName: string; lastName: string; roomNumber: string; countryCode: string }) => {
    await updateGuestMutation.mutateAsync(
      { id, data },
      {
        onSuccess: () => {
          toast.success("Guest updated");
          setEditingGuest(null);
          invalidateGuests();
        },
        onError: () => {
          toast.error("Failed to update guest");
        },
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
        onError: () => {
          toast.error("Failed to remove guest");
        },
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
          toast.success("Key renewed — new QR issued");
        },
        onError: () => {
          toast.error("Failed to renew guest key");
        },
      }
    );
  };

  if (!isAuthenticated || !isStaffRole(user?.role)) return null;

  const isRenewing = renewKeyMutation.isPending;

  return (
    <div className="min-h-[100dvh] bg-zinc-50/50 pb-24">

      {/* ── Header ── */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center shrink-0">
              <GuestProLogo variant="header" className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-[17px] font-medium text-zinc-900 leading-tight block">
                Guest Pro
              </span>
              <span className="text-[11px] text-zinc-400 font-medium leading-none">
                {roleLabel(user.role)} · {user.firstName} {user.lastName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <Button
                data-testid="button-create-guest"
                onClick={() => setLocation("/manager/guests/new")}
                size="sm"
                className="h-9 px-4 rounded-xl text-sm font-medium shadow-sm shadow-zinc-900/10 hidden sm:flex"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Guest
              </Button>
            )}
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">

        {/* ── KPI Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-zinc-500" />}
            label="Total Guests"
            value={isLoading ? "–" : stats.total}
            sub={stats.total === 1 ? "1 active guest" : `${stats.total} active guests`}
          />
          <StatCard
            icon={<CalendarPlus className="w-5 h-5 text-zinc-500" />}
            label="Checked In Today"
            value={isLoading ? "–" : stats.newToday}
            sub={stats.newToday === 0 ? "No new arrivals today" : "New arrivals today"}
          />
          <StatCard
            icon={<BedDouble className="w-5 h-5 text-zinc-500" />}
            label="Rooms Occupied"
            value={isLoading ? "–" : stats.roomsOccupied}
            sub={stats.roomsOccupied === 1 ? "1 room in use" : `${stats.roomsOccupied} rooms in use`}
          />
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <Input
              data-testid="input-search"
              placeholder="Search by name, room, or key…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 rounded-2xl bg-white border-zinc-200 focus-visible:ring-zinc-900 text-sm"
            />
          </div>

          {/* Room filter */}
          {rooms.length > 0 && (
            <Select
              value={roomFilter}
              onValueChange={setRoomFilter}
            >
              <SelectTrigger className="h-11 w-full sm:w-44 rounded-2xl border-zinc-200 bg-white text-sm font-medium focus:ring-zinc-900">
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-zinc-400" />
                  <SelectValue placeholder="All Rooms" />
                </div>
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

          {/* Mobile "New Guest" */}
          {canCreate && (
            <Button
              data-testid="button-create-guest-mobile"
              onClick={() => setLocation("/manager/guests/new")}
              className="h-11 rounded-2xl text-sm font-medium shadow-sm sm:hidden"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Guest
            </Button>
          )}
        </div>

        {/* ── Count bar ── */}
        {!isLoading && guests && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {filteredGuests.length === guests.length
                ? `${guests.length} guest${guests.length !== 1 ? "s" : ""}`
                : `${filteredGuests.length} of ${guests.length} guests`}
            </p>
            {(search || roomFilter !== "__all__") && (
              <button
                onClick={() => { setSearch(""); setRoomFilter("__all__"); }}
                className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Guest List ── */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <GuestRowSkeleton key={i} />)
          ) : filteredGuests.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100 shadow-sm">
              <Users className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              {guests && guests.length > 0 ? (
                <>
                  <h3 className="text-base font-medium text-zinc-900 mb-1">No matches</h3>
                  <p className="text-sm text-zinc-400">
                    Try adjusting your search or room filter.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-base font-medium text-zinc-900 mb-1">No guests yet</h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    Create your first guest to get started.
                  </p>
                  {canCreate && (
                    <Button
                      onClick={() => setLocation("/manager/guests/new")}
                      className="h-11 px-6 rounded-2xl text-sm font-medium shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Create Guest
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <GuestRow
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
      </main>

      {/* ── Renewing overlay ── */}
      {isRenewing && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-2xl px-10 py-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            <p className="text-sm font-medium text-zinc-600">Renewing key…</p>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      <GuestEditModal
        open={!!editingGuest}
        guest={editingGuest}
        onClose={() => setEditingGuest(null)}
        onSave={handleEdit}
        isSaving={updateGuestMutation.isPending}
      />

      {/* ── Delete Dialog ── */}
      <GuestDeleteDialog
        open={!!deletingGuest}
        guest={deletingGuest}
        onClose={() => setDeletingGuest(null)}
        onConfirm={handleDelete}
        isDeleting={deleteGuestMutation.isPending}
      />

      {/* ── Key Renewal Handoff Modal ── */}
      {handoff && (
        <GuestHandoffModal
          open={handoffOpen}
          data={handoff}
          onClose={() => { setHandoffOpen(false); setHandoff(null); }}
          onCreateAnother={() => { setHandoffOpen(false); setHandoff(null); setLocation("/manager/guests/new"); }}
        />
      )}
    </div>
  );
}
