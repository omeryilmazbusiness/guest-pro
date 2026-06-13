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

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { ROUTES } from "@/lib/app-routes";
import { useTenantNav } from "@/hooks/use-tenant-nav";
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
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { tStaff, staffScopeLabel, type StaffTranslations } from "@/lib/staff-i18n";
import { isStaffRole, can, Permission } from "@/lib/permissions";
import { useStaffScope } from "@/hooks/use-staff-scope";
import { useHotelDisplay } from "@/hooks/use-hotel-display";
import type { StaffActor } from "@/lib/staff-scope";
import { filterGuests, extractRoomNumbers, countByStatus } from "@/lib/guests";
import { aggregateRooms, filterRooms } from "@/lib/rooms";
import { type StayStatus } from "@/lib/stays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GuestCard } from "@/components/manager/GuestCard";
import { RoomCard } from "@/components/manager/RoomCard";
import { GuestEditModal } from "@/components/manager/GuestEditModal";
import { GuestDeleteDialog } from "@/components/manager/GuestDeleteDialog";
import { GuestHandoffModal, type HandoffData } from "@/components/GuestHandoffModal";
import { getGuestPresences, type TrackingStatus } from "@/lib/tracking";
import { computeTrackingSummary } from "@/lib/tracking-summary";
import { GuestsOverviewCard } from "@/components/manager/GuestsOverviewCard";
import { ManagerOverviewCards } from "@/components/manager/ManagerOverviewCards";
import { ManagerDashboardHeader } from "@/components/manager/ManagerDashboardHeader";
import { GmSetupWizard } from "@/components/manager/GmSetupWizard";
import { ManagerAnimatedTabs } from "@/components/manager/ManagerAnimatedTabs";
import { ManagerTabPanel } from "@/components/manager/ManagerTabPanel";
import { GuestDetailSheet } from "@/components/manager/GuestDetailSheet";
import type { ManagerDashboardTab } from "@/lib/manager-dashboard-nav";
import { StaffRequestsBoard } from "@/components/manager/StaffRequestsBoard";
import { StaffFeedbackBoard } from "@/components/manager/StaffFeedbackBoard";
import { NewRequestAlert } from "@/components/manager/NewRequestAlert";
import { WelcomeAreaAlertBanner } from "@/components/manager/WelcomeAreaAlertBanner";
import { DailySummaryTab } from "@/components/manager/DailySummaryTab";
import { DailyTaskInsightBanner } from "@/components/manager/DailyTaskInsightBanner";
import { DailyTaskInsightSheet } from "@/components/manager/DailyTaskInsightSheet";
import { getDailyTaskInsight } from "@/lib/analytics";
import {
  dismissDailyTaskInsight,
  isDailyTaskInsightDismissed,
} from "@/lib/daily-task-insight-dismiss";
import { StaffTeamTab } from "@/components/manager/StaffTeamTab";
import { TasksTab } from "@/components/manager/tasks/TasksTab";
import { GuestSearchFilterBar } from "@/components/manager/GuestSearchFilterBar";
import { CreateGuestSheet } from "@/components/manager/CreateGuestSheet";
import { type StaffInfo } from "@/lib/staff";


// ─── Sticky rooms filter bar ──────────────────────────────────────────────────
//
// Rendered as a sibling of <main>, sticky at top-14 (below the 56px header).
// Only shows room number search — all derived rooms are occupied (no status filter needed).

function StickyRoomFilterBar({
  search,
  onSearchChange,
  t,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  t: StaffTranslations;
}) {
  return (
    <div className="sticky top-14 z-10 bg-zinc-50/95 backdrop-blur-sm border-b border-zinc-200/60">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <Input
            placeholder={t.searchRoomPlaceholder}
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
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40 rounded" />
        <Skeleton className="h-2.5 w-32 rounded" />
        <Skeleton className="h-2.5 w-24 rounded" />
      </div>
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
  const { appName } = useHotelDisplay();
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const goTo = useTenantNav();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const { t, locale, dir, setLocale } = useStaffLocale();
  const staffScope = useStaffScope();

  const actor: StaffActor | undefined = useMemo(() => {
    if (!user?.role) return undefined;
    return {
      role: user.role,
      staffDepartment:
        "staffDepartment" in user
          ? (user as { staffDepartment?: string | null }).staffDepartment
          : null,
    };
  }, [user]);

  const needsGuestData = Boolean(
    staffScope &&
      (staffScope.canViewGuests || staffScope.scope === "staff_personnel"),
  );

  const needsTracking = Boolean(
    staffScope &&
      (staffScope.canViewGuests || staffScope.scope === "staff_personnel"),
  );

  // ── Data
  const { data: guests, isLoading } = useListGuests({
    query: {
      queryKey: ["guests", "list"],
      enabled: isAuthenticated && isStaffRole(user?.role) && needsGuestData,
    },
  });

  // ── Presence data (tracking) — refetch every 60 s while dashboard is open.
  const { data: presences, isFetching: presencesFetching } = useQuery({
    queryKey: ["tracking", "presences"],
    queryFn: getGuestPresences,
    enabled: isAuthenticated && isStaffRole(user?.role) && needsTracking,
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

  // ── Tab (reads ?tab= from URL for deep-linking; defaults to "team" for managers)
  const [activeTab, setActiveTab] = useState<ManagerDashboardTab>(() => {
    const param = new URLSearchParams(window.location.search).get("tab");
    if (
      param === "guests" ||
      param === "rooms" ||
      param === "requests" ||
      param === "feedback" ||
      param === "summary" ||
      param === "team" ||
      param === "tasks"
    ) {
      return param;
    }
    return "guests"; // real default set below via useEffect once role resolves
  });

  // Employee overview info — updated by StaffTeamTab when list loads/changes
  const [staffInfo, setStaffInfo] = useState<StaffInfo>({ total: 0, active: 0, byDept: {} });

  // Controlled create-employee modal — can be triggered from the overview card
  const [staffCreateOpen, setStaffCreateOpen] = useState(false);

  // Resolve initial tab from URL (?tab=) or scope default — once per mount.
  const hasAutoSwitchedTab = useRef(false);
  useEffect(() => {
    if (hasAutoSwitchedTab.current || !staffScope) return;
    const param = new URLSearchParams(window.location.search).get("tab");
    const tabParam = param as ManagerDashboardTab | null;
    if (tabParam && staffScope.canAccessTab(tabParam)) {
      setActiveTab(tabParam);
    } else if (!param) {
      setActiveTab(staffScope.defaultTab);
    } else {
      setActiveTab(staffScope.defaultTab);
    }
    hasAutoSwitchedTab.current = true;
  }, [staffScope]);

  // Keep active tab in sync when scope forbids the current tab.
  useEffect(() => {
    if (!staffScope) return;
    if (!staffScope.canAccessTab(activeTab)) {
      setActiveTab(staffScope.defaultTab);
    }
  }, [staffScope, activeTab]);

  // ── Daily task insight (18:00 report)
  const [taskInsightSheetOpen, setTaskInsightSheetOpen] = useState(false);
  const [insightBannerDismissed, setInsightBannerDismissed] = useState(false);

  const canSeeTaskInsight =
    staffScope?.canAccessTab("tasks") || staffScope?.scope === "department_manager";

  const { data: dailyTaskInsight } = useQuery({
    queryKey: ["daily-task-insight", locale],
    queryFn: () => getDailyTaskInsight(locale),
    enabled: !!canSeeTaskInsight && isAuthenticated,
    refetchInterval: 30_000,
  });

  const showInsightBanner =
    !!dailyTaskInsight &&
    !insightBannerDismissed &&
    !isDailyTaskInsightDismissed(dailyTaskInsight.id);

  const openTaskInsight = useCallback(() => {
    if (dailyTaskInsight) {
      dismissDailyTaskInsight(dailyTaskInsight.id);
      setInsightBannerDismissed(true);
    }
    setTaskInsightSheetOpen(true);
  }, [dailyTaskInsight]);

  // ── Open request count (updated by StaffRequestsBoard)
  const [openRequestCount, setOpenRequestCount] = useState(0);
  const [openFeedbackCount, setOpenFeedbackCount] = useState(0);

  const handleNavigateToRequests = useCallback(() => {
    setActiveTab("requests");
  }, []);

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
  const [detailGuest, setDetailGuest] = useState<Guest | null>(null);
  const [createGuestOpen, setCreateGuestOpen] = useState(false);

  // ── Auth guard
  useEffect(() => {
    if (!isAuthenticated) goTo(ROUTES.managerLogin);
    else if (user && !isStaffRole(user.role)) goTo(ROUTES.guest);
    else if (staffScope?.scope === "restaurant_personnel") goTo(ROUTES.restaurant);
    else if (staffScope?.scope === "staff_personnel") goTo(ROUTES.staff);
  }, [isAuthenticated, user, staffScope, goTo]);

  // ── Permissions (scope-aware)
  const canEdit = can(actor, Permission.EDIT_GUEST);
  const canDelete = can(actor, Permission.DELETE_GUEST);
  const canRenew = can(actor, Permission.RENEW_GUEST_KEY);
  const canCreate = can(actor, Permission.CREATE_GUEST);

  const overviewVariant = useMemo((): "both" | "guests" | "employees" | null => {
    if (!staffScope) return null;
    switch (staffScope.scope) {
      case "general_manager":
        return "both";
      case "department_manager":
        return "employees";
      case "reception":
        return "guests";
      default:
        return null;
    }
  }, [staffScope]);

  const roleLine = useMemo(() => {
    if (!user) return "";
    const label = staffScope
      ? staffScopeLabel(staffScope.scope, staffScope.actor.staffDepartment, t)
      : "Staff";
    return `${label} · ${user.firstName} ${user.lastName}`;
  }, [user, staffScope, t]);

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
    toast.success(t.loggedOut);
  };

  const handleNavigateCreate = () => setCreateGuestOpen(true);

  const handleEdit = async (
    id: number,
    data: {
      firstName: string;
      lastName: string;
      roomNumber: string;
      countryCode: string;
      checkInDate?: string;
      checkOutDate?: string;
      wifiNetworkId?: number;
    }
  ) => {
    await updateGuestMutation.mutateAsync(
      { id, data },
      {
        onSuccess: () => {
          toast.success(t.guestUpdated);
          setEditingGuest(null);
          invalidateGuests();
        },
        onError: () => toast.error(t.failedUpdateGuest),
      }
    );
  };

  const handleDelete = async (id: number) => {
    await deleteGuestMutation.mutateAsync(
      { id },
      {
        onSuccess: () => {
          toast.success(t.guestRemoved);
          setDeletingGuest(null);
          invalidateGuests();
        },
        onError: () => toast.error(t.failedRemoveGuest),
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
          toast.success(t.keyRenewed);
        },
        onError: () => toast.error(t.failedRenewKey),
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

  if (!isAuthenticated || !isStaffRole(user?.role) || !staffScope) return null;

  return (
    <div className="min-h-dvh bg-zinc-50/60" dir={dir}>

      {/* ── Sticky header (56px) ── */}
      <ManagerDashboardHeader
        appName={appName}
        roleLine={roleLine}
        t={t}
        locale={locale}
        dir={dir}
        onLocaleChange={setLocale}
        scope={staffScope.scope}
        isGeneralManager={staffScope.isGeneralManager}
        guestCount={guests?.length ?? 0}
        roomCount={allRooms.length}
        requestCount={openRequestCount}
        feedbackCount={openFeedbackCount}
        teamCount={staffInfo.active}
        canCreateGuest={canCreate}
        onTabChange={setActiveTab}
        onCreateGuest={handleNavigateCreate}
        onSettings={() => goTo(ROUTES.managerSettings)}
        rightSlot={
          <>
            {canCreate && (
              <Button
                data-testid="button-create-guest-desktop"
                onClick={handleNavigateCreate}
                size="sm"
                className="hidden h-8 rounded-xl px-3.5 text-[13px] font-medium shadow-sm shadow-zinc-900/10 sm:flex"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t.newGuest}
              </Button>
            )}
            {staffScope.isGeneralManager && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => goTo(ROUTES.managerSettings)}
                className="hidden h-8 w-8 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation sm:flex"
                aria-label={t.settings}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 touch-manipulation"
              aria-label={t.logout}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </>
        }
      />

      {staffScope.isGeneralManager && <GmSetupWizard />}

      {/* ── Sticky filter bars — below header, tab-conditional ── */}
      {activeTab === "rooms" && (
        <StickyRoomFilterBar
          search={roomSearch}
          onSearchChange={setRoomSearch}
          t={t}
        />
      )}

      {/* ── Scrollable main content ── */}
      <main
        className={`max-w-2xl mx-auto px-4 py-5 pb-28 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300${showInsightBanner ? " pt-24" : ""}`}
      >

        {/* ─── Presence overview ─── */}
        {!isLoading && overviewVariant ? (
            <ManagerOverviewCards
              variant={overviewVariant}
              guestSummary={trackingSummary}
              isRefreshing={presencesFetching}
              onRefresh={handleRefreshTracking}
              staffInfo={staffInfo}
              onAddEmployee={() => setStaffCreateOpen(true)}
              onGuestsPress={
                staffScope.canAccessTab("guests")
                  ? () => setActiveTab("guests")
                  : undefined
              }
              onEmployeesPress={
                staffScope.canAccessTab("team")
                  ? () => setActiveTab("team")
                  : undefined
              }
              dailyTaskInsight={dailyTaskInsight}
              insightPending={!dailyTaskInsight}
              onAiInsightPress={
                staffScope.scope === "department_manager" ? openTaskInsight : undefined
              }
              t={t}
            />
          ) : !isLoading && needsTracking ? (
            <GuestsOverviewCard
              summary={trackingSummary}
              isRefreshing={presencesFetching}
              onRefresh={handleRefreshTracking}
            />
          ) : null}

        {/* Tab switcher */}
        <ManagerAnimatedTabs
          active={activeTab}
          onChange={setActiveTab}
          scope={staffScope.scope}
          guestCount={guests?.length ?? 0}
          roomCount={allRooms.length}
          requestCount={openRequestCount}
          feedbackCount={openFeedbackCount}
          teamCount={staffInfo.active}
          t={t}
        />

        <ManagerTabPanel tabKey={activeTab}>

        {/* ══════════════════════════════════
            GUESTS TAB
        ══════════════════════════════════ */}
        {activeTab === "guests" && staffScope.canAccessTab("guests") && (
          <div className="space-y-3">
            <GuestSearchFilterBar
              search={guestSearch}
              onSearchChange={setGuestSearch}
              roomFilter={roomFilter}
              onRoomChange={setRoomFilter}
              rooms={roomNumbers}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              statusCounts={statusCounts}
              t={t}
            />

            {/* Count + clear */}
            {!isLoading && guests && (guestHasFilters || guests.length > 0) && (
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-zinc-400 font-medium">
                  {filteredGuests.length === guests.length
                    ? tStaff(t.guestsNewestFirst, { n: guests.length })
                    : tStaff(t.guestsFiltered, { n: filteredGuests.length, total: guests.length })}
                </p>
                {guestHasFilters && (
                  <button
                    onClick={clearGuestFilters}
                    className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                    {t.clearFilters}
                  </button>
                )}
              </div>
            )}

            {/* Guest list */}
            <div>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => <GuestCardSkeleton key={i} />)}
                </div>
              ) : filteredGuests.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-2xl border border-zinc-100">
                  <Users className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                  {guests && guests.length > 0 ? (
                    <>
                      <p className="text-sm font-medium text-zinc-700 mb-1">{t.noMatches}</p>
                      <p className="text-xs text-zinc-400 mb-4">{t.tryDifferentSearch}</p>
                      <button
                        onClick={clearGuestFilters}
                        className="text-xs text-zinc-500 underline underline-offset-2"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-zinc-700 mb-1">{t.noGuestsYet}</p>
                      <p className="text-xs text-zinc-400 mb-5">{t.checkInFirstGuest}</p>
                      {canCreate && (
                        <button
                          onClick={handleNavigateCreate}
                          className="inline-flex items-center gap-1.5 bg-zinc-900 text-white rounded-2xl px-5 py-2.5 text-sm font-medium active:scale-95 transition-all touch-manipulation"
                        >
                          <Plus className="w-4 h-4" />
                          {t.checkInGuest}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGuests.map((guest) => (
                    <GuestCard
                      key={guest.id}
                      guest={guest}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      canRenew={canRenew}
                      onEdit={setEditingGuest}
                      onDelete={setDeletingGuest}
                      onRenew={handleRenewKey}
                      onSelect={setDetailGuest}
                      trackingStatus={presenceMap.get(guest.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            ROOMS TAB
            (filter bar is sticky above — not rendered here)
        ══════════════════════════════════ */}
        {activeTab === "rooms" && staffScope.canAccessTab("rooms") && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Result count */}
            {!isLoading && (
              <div className="px-1">
                <p className="text-xs text-zinc-400 font-medium">
                  {filteredRooms.length === allRooms.length
                    ? tStaff(t.roomsOccupied, { n: allRooms.length })
                    : tStaff(t.roomsFiltered, { n: filteredRooms.length, total: allRooms.length })}
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
                    <p className="text-sm font-medium text-zinc-700 mb-1">{t.noRoomsMatch}</p>
                    <p className="text-xs text-zinc-400 mb-4">{t.tryDifferentRoom}</p>
                    <button
                      onClick={clearRoomFilters}
                      className="text-xs text-zinc-500 underline underline-offset-2"
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-zinc-700 mb-1">{t.noRoomsYet}</p>
                    <p className="text-xs text-zinc-400">{t.roomsAutomatic}</p>
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
        {activeTab === "requests" && staffScope.canAccessTab("requests") && (
          <div className="animate-in fade-in duration-200">
            <StaffRequestsBoard
              presenceMap={presenceMap}
              onOpenCountChange={setOpenRequestCount}
            />
          </div>
        )}

        {activeTab === "feedback" && staffScope.canAccessTab("feedback") && (
          <div className="animate-in fade-in duration-200">
            <StaffFeedbackBoard
              presenceMap={presenceMap}
              onOpenCountChange={setOpenFeedbackCount}
            />
          </div>
        )}

        {/* ══════════════════════════════════
            DAILY SUMMARY TAB (manager-only)
        ══════════════════════════════════ */}
        {activeTab === "summary" && staffScope.canAccessTab("summary") && (
          <div className="animate-in fade-in duration-200">
            <DailySummaryTab />
          </div>
        )}

        {/* ══════════════════════════════════
            TEAM TAB (manager-only)
        ══════════════════════════════════ */}
        {activeTab === "team" && staffScope.canAccessTab("team") && (
          <StaffTeamTab
            staffCount={setStaffInfo}
            externalCreateOpen={staffCreateOpen}
            onExternalCreateOpenChange={setStaffCreateOpen}
            lockedDepartment={staffScope.departmentScope ?? undefined}
            showDepartmentManagers={staffScope.isGeneralManager}
            isGeneralManager={staffScope.isGeneralManager}
          />
        )}

        {activeTab === "tasks" && staffScope.canAccessTab("tasks") && (
          <TasksTab />
        )}

        </ManagerTabPanel>
      </main>

      {/* ── Mobile FAB ── */}
      {canCreate && activeTab === "guests" && (
        <div className="fixed bottom-6 right-5 z-30 sm:hidden">
          <button
            data-testid="button-create-guest"
            onClick={handleNavigateCreate}
            className="flex items-center gap-2 bg-zinc-900 text-white rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-2xl shadow-zinc-900/30 hover:bg-zinc-800 active:scale-95 transition-all touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            {t.newGuest}
          </button>
        </div>
      )}

      {/* ── Renew overlay ── */}
      {renewKeyMutation.isPending && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-2xl px-10 py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
            <p className="text-sm font-medium text-zinc-600">{t.renewingKey}</p>
          </div>
        </div>
      )}

      <CreateGuestSheet
        open={createGuestOpen}
        onClose={() => setCreateGuestOpen(false)}
        onCreated={invalidateGuests}
      />

      <GuestDetailSheet
        guest={detailGuest}
        open={!!detailGuest}
        onClose={() => setDetailGuest(null)}
        trackingStatus={detailGuest ? presenceMap.get(detailGuest.id) : undefined}
        canEdit={canEdit}
        canDelete={canDelete}
        canRenew={canRenew}
        onEdit={setEditingGuest}
        onDelete={setDeletingGuest}
        onRenew={handleRenewKey}
        t={t}
      />

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
            setCreateGuestOpen(true);
          }}
        />
      )}

      {/* ── New request alert — fixed top banner, visible on all tabs ── */}
      <NewRequestAlert
        onNavigateToRequests={handleNavigateToRequests}
        enabled={isAuthenticated && !!user}
      />

      {/* ── Welcome-area alert banner — shows when anonymous guests call for help ── */}
      <WelcomeAreaAlertBanner enabled={isAuthenticated && !!user} />

      {showInsightBanner && dailyTaskInsight && (
        <DailyTaskInsightBanner insight={dailyTaskInsight} t={t} onOpen={openTaskInsight} />
      )}

      <DailyTaskInsightSheet
        open={taskInsightSheetOpen}
        onClose={() => setTaskInsightSheetOpen(false)}
        insight={dailyTaskInsight ?? null}
        t={t}
      />
    </div>
  );
}
