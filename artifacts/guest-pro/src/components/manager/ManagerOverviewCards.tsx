/**
 * ManagerOverviewCards — compact premium overview for manager mobile dashboard.
 */

import {
  Users,
  Briefcase,
  RefreshCw,
  Plus,
  Building2,
  DoorOpen,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuestTrackingSummary } from "@/lib/tracking-summary";
import type { StaffInfo, StaffDepartment } from "@/lib/staff";
import { DEPARTMENT_LABELS } from "@/lib/staff";
import type { StaffTranslations } from "@/lib/staff-i18n";

const ORDERED_DEPTS: StaffDepartment[] = [
  "RECEPTION",
  "HOUSEKEEPING",
  "RESTAURANT",
  "BELLMAN",
];

interface ManagerOverviewCardsProps {
  guestSummary: GuestTrackingSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  staffInfo: StaffInfo;
  onAddEmployee: () => void;
  onGuestsPress?: () => void;
  onEmployeesPress?: () => void;
  t: StaffTranslations;
}

function PresenceStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.FC<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl bg-zinc-50 px-2 py-2.5 text-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-100">
        <Icon className="h-3.5 w-3.5 text-zinc-600" />
      </span>
      <span className="font-mono text-base font-bold tabular-nums leading-none text-zinc-900">
        {value}
      </span>
      <span className="text-[10px] font-medium leading-snug text-zinc-500">{label}</span>
    </div>
  );
}

function DeptStat({ dept, count }: { dept: StaffDepartment; count: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-2.5 py-2">
      <span className="text-[11px] font-medium leading-tight text-zinc-600">
        {DEPARTMENT_LABELS[dept]}
      </span>
      <span className="font-mono text-sm font-bold tabular-nums text-zinc-900">{count}</span>
    </div>
  );
}

interface OverviewCardShellProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  total: number;
  subtitle: string;
  onPress?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function OverviewCardShell({
  icon: Icon,
  title,
  total,
  subtitle,
  onPress,
  action,
  children,
}: OverviewCardShellProps) {
  const handleKeyDown = onPress
    ? (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPress();
        }
      }
    : undefined;

  return (
    <div
      role={onPress ? "button" : undefined}
      tabIndex={onPress ? 0 : undefined}
      onClick={onPress}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border border-zinc-200/80 bg-white px-3 py-3 text-left shadow-sm shadow-zinc-900/[0.03]",
        onPress &&
          "cursor-pointer touch-manipulation transition-transform active:scale-[0.98] hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 leading-none">
              {title}
            </p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums leading-none text-zinc-900">
              {total}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-zinc-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ManagerOverviewCards({
  guestSummary,
  isRefreshing,
  onRefresh,
  staffInfo,
  onAddEmployee,
  onGuestsPress,
  onEmployeesPress,
  t,
}: ManagerOverviewCardsProps) {
  const deptEntries = ORDERED_DEPTS.filter((d) => (staffInfo.byDept[d] ?? 0) > 0);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <OverviewCardShell
        icon={Users}
        title={t.overviewGuests}
        total={guestSummary.total}
        subtitle={
          guestSummary.total === 1 ? t.overviewGuestSingular : t.overviewGuestPlural
        }
        onPress={onGuestsPress}
        action={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isRefreshing}
            aria-label={t.overviewRefresh}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-800 active:scale-90 disabled:opacity-40"
          >
            <RefreshCw
              className={cn("h-3 w-3", isRefreshing && "animate-spin")}
              strokeWidth={2}
            />
          </button>
        }
      >
        {guestSummary.total === 0 ? (
          <p className="text-[11px] italic text-zinc-300">{t.noGuestsYet}</p>
        ) : !guestSummary.hasTrackingData ? (
          <p className="text-[11px] text-zinc-400 leading-snug">{t.overviewTrackingPending}</p>
        ) : (
          <div className="flex gap-1.5">
            <PresenceStat icon={Building2} value={guestSummary.inHotel} label={t.presenceIn} />
            <PresenceStat icon={DoorOpen} value={guestSummary.outOfHotel} label={t.presenceOut} />
            {guestSummary.unknown > 0 && (
              <PresenceStat icon={HelpCircle} value={guestSummary.unknown} label={t.presenceUnknown} />
            )}
          </div>
        )}
      </OverviewCardShell>

      <OverviewCardShell
        icon={Briefcase}
        title={t.overviewEmployees}
        total={staffInfo.total}
        subtitle={`${staffInfo.active} ${t.overviewActiveShort}`}
        onPress={onEmployeesPress}
        action={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddEmployee();
            }}
            aria-label={t.overviewAddEmployee}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-800 active:scale-90"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
          </button>
        }
      >
        {staffInfo.total === 0 ? (
          <p className="text-[11px] italic text-zinc-300">{t.overviewNoEmployees}</p>
        ) : deptEntries.length > 0 ? (
          <div className="flex flex-col gap-1">
            {deptEntries.slice(0, 3).map((dept) => (
              <DeptStat key={dept} dept={dept} count={staffInfo.byDept[dept] ?? 0} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400">
            {staffInfo.active} {t.overviewActiveShort}
          </p>
        )}
      </OverviewCardShell>
    </div>
  );
}
