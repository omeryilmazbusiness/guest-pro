/**
 * ManagerOverviewCards — 2 compact presence cards for the manager dashboard.
 *
 * Replaces the single GuestsOverviewCard for managers with two smaller,
 * more focused cards:
 *
 *   Card 1 — Guest Presence
 *     Real-time breakdown: In hotel · Out · Unknown
 *     Refresh action. No donut — clean stat rows only.
 *
 *   Card 2 — Employee Overview
 *     Total / Active counts + per-department breakdown.
 *     "Add Employee" shortcut.
 *
 * Both cards share the same visual language: white, rounded-2xl, soft shadow,
 * minimal labels, high readability at a glance.
 */

import { RefreshCw, Plus } from "lucide-react";
import type { GuestTrackingSummary } from "@/lib/tracking-summary";
import type { StaffInfo, StaffDepartment } from "@/lib/staff";
import { DEPARTMENT_LABELS, DEPARTMENT_COLOURS } from "@/lib/staff";

// ── Colour tokens (match GuestsOverviewCard) ──────────────────────────────────

const COLOR_IN      = "#10b981"; // emerald-500
const COLOR_OUT     = "#f43f5e"; // rose-500
const COLOR_UNKNOWN = "#d4d4d8"; // zinc-300

// ── Shared primitives ─────────────────────────────────────────────────────────

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
      {children}
    </p>
  );
}

function StatRow({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-[13px] font-semibold text-zinc-800 tabular-nums leading-none">
        {count}
      </span>
      <span className="text-[11px] text-zinc-400 leading-none truncate">{label}</span>
    </div>
  );
}

// ── Card 1: Guest Presence ────────────────────────────────────────────────────

interface GuestPresenceCardProps {
  summary: GuestTrackingSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function GuestPresenceCard({ summary, isRefreshing, onRefresh }: GuestPresenceCardProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm shadow-zinc-100/50 px-4 py-3.5 flex flex-col gap-3 min-h-[140px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardLabel>Guests</CardLabel>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh"
          aria-label="Refresh guest presence"
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 active:scale-90 disabled:opacity-40 transition-all touch-manipulation"
        >
          <RefreshCw
            className={`w-3 h-3 transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Total */}
      <div>
        <p className="text-2xl font-bold text-zinc-900 leading-none">{summary.total}</p>
        <p className="text-[10px] text-zinc-400 mt-0.5">
          {summary.total === 1 ? "guest" : "guests"}
        </p>
      </div>

      {/* Presence rows */}
      <div className="flex flex-col gap-1.5">
        {summary.total === 0 ? (
          <p className="text-[11px] text-zinc-300 italic">No guests yet</p>
        ) : !summary.hasTrackingData ? (
          <p className="text-[10px] text-zinc-300 leading-snug">
            Tracking not active yet
          </p>
        ) : (
          <>
            <StatRow color={COLOR_IN}      count={summary.inHotel}    label="in hotel"     />
            <StatRow color={COLOR_OUT}     count={summary.outOfHotel} label="out of hotel"  />
            <StatRow color={COLOR_UNKNOWN} count={summary.unknown}    label="unknown"      />
          </>
        )}
      </div>
    </div>
  );
}

// ── Card 2: Employee Overview ─────────────────────────────────────────────────

const ORDERED_DEPTS: StaffDepartment[] = [
  "HOUSEKEEPING",
  "RECEPTION",
  "RESTAURANT",
  "BELLMAN",
];

interface EmployeeOverviewCardProps {
  info: StaffInfo;
  onAddEmployee: () => void;
}

function EmployeeOverviewCard({ info, onAddEmployee }: EmployeeOverviewCardProps) {
  const deptEntries = ORDERED_DEPTS.filter((d) => (info.byDept[d] ?? 0) > 0);

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm shadow-zinc-100/50 px-4 py-3.5 flex flex-col gap-3 min-h-[140px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <CardLabel>Employees</CardLabel>
        <button
          onClick={onAddEmployee}
          title="Add employee"
          aria-label="Add employee"
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 active:scale-90 transition-all touch-manipulation"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Total */}
      <div>
        <p className="text-2xl font-bold text-zinc-900 leading-none">{info.total}</p>
        <p className="text-[10px] text-zinc-400 mt-0.5">
          {info.active} active
        </p>
      </div>

      {/* Dept breakdown — only show when data is available */}
      {deptEntries.length > 0 ? (
        <div className="flex flex-col gap-1">
          {deptEntries.map((dept) => {
            const c = DEPARTMENT_COLOURS[dept];
            return (
              <div key={dept} className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none ${c.bg} ${c.text}`}
                >
                  {DEPARTMENT_LABELS[dept]}
                </span>
                <span className="text-[11px] font-semibold text-zinc-700 tabular-nums leading-none">
                  {info.byDept[dept]}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-zinc-300 italic">No employees yet</p>
      )}
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

interface ManagerOverviewCardsProps {
  guestSummary: GuestTrackingSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  staffInfo: StaffInfo;
  onAddEmployee: () => void;
}

export function ManagerOverviewCards({
  guestSummary,
  isRefreshing,
  onRefresh,
  staffInfo,
  onAddEmployee,
}: ManagerOverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <GuestPresenceCard
        summary={guestSummary}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />
      <EmployeeOverviewCard
        info={staffInfo}
        onAddEmployee={onAddEmployee}
      />
    </div>
  );
}
