/**
 * ManagerOverviewCards — premium icon overview tiles (GM / reception / dept manager).
 */

import {
  Users,
  Briefcase,
  RefreshCw,
  Plus,
  Building2,
  DoorOpen,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuestTrackingSummary } from "@/lib/tracking-summary";
import type { StaffInfo, StaffDepartment } from "@/lib/staff";
import { DEPARTMENT_LABELS } from "@/lib/staff";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { DailyTaskInsightRecord } from "@/lib/analytics";
import { ManagerAiInsightCard } from "@/components/manager/ManagerAiInsightCard";

const ORDERED_DEPTS: StaffDepartment[] = [
  "RECEPTION",
  "HOUSEKEEPING",
  "RESTAURANT",
  "BELLMAN",
];

const OVERVIEW_CARD =
  "relative flex w-full min-w-0 flex-col rounded-xl border border-zinc-200/90 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]";

interface ManagerOverviewCardsProps {
  variant: "both" | "guests" | "employees";
  guestSummary: GuestTrackingSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  staffInfo: StaffInfo;
  onAddEmployee: () => void;
  onGuestsPress?: () => void;
  onEmployeesPress?: () => void;
  dailyTaskInsight?: DailyTaskInsightRecord | null;
  insightPending?: boolean;
  onAiInsightPress?: () => void;
  t: StaffTranslations;
}

function iconActionBtn(className?: string) {
  return cn(
    "flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors",
    "hover:bg-zinc-50 hover:text-zinc-700 active:scale-90 disabled:opacity-40",
    className,
  );
}

function OverviewIconCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  hint,
  onPress,
  action,
  footer,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: number | string;
  hint?: string;
  onPress?: () => void;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const Wrapper = onPress ? "button" : "div";

  return (
    <div className={OVERVIEW_CARD}>
      {action ? <div className="absolute end-2 top-2 z-[1]">{action}</div> : null}
      <Wrapper
        type={onPress ? "button" : undefined}
        onClick={onPress}
        className={cn(
          "flex w-full flex-col items-center gap-1.5 text-center",
          onPress &&
            "cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 rounded-lg active:scale-[0.99] transition-transform",
        )}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center" aria-hidden>
          <Icon
            className={cn("guest-chat-entry-icon h-6 w-6", iconClassName)}
            strokeWidth={1.5}
          />
        </span>
        <span className="block w-full">
          <span className="block font-mono text-[20px] font-bold tabular-nums leading-none text-zinc-900">
            {value}
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </span>
          {hint ? (
            <span className="mt-0.5 block text-[9px] font-medium text-zinc-400">{hint}</span>
          ) : null}
        </span>
      </Wrapper>
      {footer}
    </div>
  );
}

function PresenceMini({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  iconClassName: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg bg-zinc-50/80 px-1 py-1.5 text-center"
      title={label}
    >
      <span className="inline-flex items-center gap-1">
        <Icon className={cn("h-3 w-3 shrink-0", iconClassName)} strokeWidth={2} />
        <span className="font-mono text-[12px] font-bold tabular-nums leading-none text-zinc-900">
          {value}
        </span>
      </span>
      <span className="max-w-full truncate text-[7px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export function ManagerOverviewCards({
  variant,
  guestSummary,
  isRefreshing,
  onRefresh,
  staffInfo,
  onAddEmployee,
  onGuestsPress,
  onEmployeesPress,
  dailyTaskInsight,
  insightPending = true,
  onAiInsightPress,
  t,
}: ManagerOverviewCardsProps) {
  const deptEntries = ORDERED_DEPTS.filter((d) => (staffInfo.byDept[d] ?? 0) > 0);
  const showGuests = variant === "both" || variant === "guests";
  const showEmployees = variant === "both" || variant === "employees";
  const showAiSquare = variant === "employees" && onAiInsightPress;
  const gridClass = variant === "both" ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1 gap-2.5";

  const guestsFooter =
    guestSummary.total === 0 ? (
      <p className="mt-2 text-center text-[9px] text-zinc-400">{t.noGuestsYet}</p>
    ) : !guestSummary.hasTrackingData ? (
      <p className="mt-2 text-center text-[9px] leading-snug text-zinc-400">
        {t.overviewTrackingPending}
      </p>
    ) : (
      <div className="mt-2 flex w-full gap-1.5">
        <PresenceMini
          icon={Building2}
          value={guestSummary.inHotel}
          label={t.presenceIn}
          iconClassName="text-emerald-600"
        />
        <PresenceMini
          icon={DoorOpen}
          value={guestSummary.outOfHotel}
          label={t.presenceOut}
          iconClassName="text-amber-600"
        />
        {guestSummary.unknown > 0 && (
          <PresenceMini
            icon={HelpCircle}
            value={guestSummary.unknown}
            label={t.presenceUnknown}
            iconClassName="text-zinc-400"
          />
        )}
      </div>
    );

  const employeesFooter =
    staffInfo.total === 0 ? (
      <p className="mt-2 text-center text-[9px] text-zinc-400">{t.overviewNoEmployees}</p>
    ) : deptEntries.length > 0 ? (
      <div className="mt-2 w-full space-y-1 rounded-lg bg-zinc-50/80 px-2 py-1.5">
        {deptEntries.slice(0, 2).map((dept) => (
          <div key={dept} className="flex items-center justify-between gap-2 text-[9px]">
            <span className="truncate text-zinc-500">{DEPARTMENT_LABELS[dept]}</span>
            <span className="shrink-0 font-mono font-semibold tabular-nums text-zinc-800">
              {staffInfo.byDept[dept] ?? 0}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <p className="mt-2 text-center text-[9px] text-zinc-400">
        {staffInfo.active} {t.overviewActiveShort}
      </p>
    );

  const employeesTile = showEmployees ? (
    <OverviewIconCard
      icon={Briefcase}
      iconClassName="text-violet-600"
      label={t.overviewEmployees}
      value={staffInfo.total}
      hint={`${staffInfo.active} ${t.overviewActiveShort}`}
      onPress={onEmployeesPress}
      action={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddEmployee();
          }}
          aria-label={t.overviewAddEmployee}
          className={iconActionBtn()}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      }
      footer={employeesFooter}
    />
  ) : null;

  if (showAiSquare) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-stretch gap-2.5">
        {employeesTile}
        <ManagerAiInsightCard
          insight={dailyTaskInsight}
          pending={insightPending || !dailyTaskInsight}
          t={t}
          onPress={onAiInsightPress}
        />
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {showGuests && (
        <OverviewIconCard
          icon={Users}
          iconClassName="text-sky-600"
          label={t.overviewGuests}
          value={guestSummary.total}
          hint={guestSummary.total === 1 ? t.overviewGuestSingular : t.overviewGuestPlural}
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
              className={iconActionBtn()}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
                strokeWidth={2}
              />
            </button>
          }
          footer={guestsFooter}
        />
      )}

      {showEmployees && employeesTile}
    </div>
  );
}
