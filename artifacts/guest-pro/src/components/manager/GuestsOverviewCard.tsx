/**
 * GuestsOverviewCard — Premium guest presence overview for the manager/staff dashboard.
 *
 * Displays a donut chart showing the real-time ratio of:
 *   ● Green  — guests inside the hotel geofence
 *   ● Red    — guests confirmed outside the hotel
 *   ● Gray   — guests with unknown/no location data
 *
 * Architecture:
 *   - Receives a `GuestTrackingSummary` (computed externally in lib/tracking-summary.ts)
 *   - All rendering logic is self-contained — no fetch calls, no query clients
 *   - The donut is a hand-crafted SVG ring — no chart library needed
 *   - The refresh action is a callback from the parent (dashboard owns the query)
 */

import { RefreshCw } from "lucide-react";
import type { GuestTrackingSummary } from "@/lib/tracking-summary";

// ---------------------------------------------------------------------------
// Colours (shared across donut + legend)
// ---------------------------------------------------------------------------

const COLOR_IN     = "#10b981"; // emerald-500
const COLOR_OUT    = "#f43f5e"; // rose-500
const COLOR_UNKNOWN = "#d4d4d8"; // zinc-300
const COLOR_TRACK  = "#f4f4f5"; // zinc-100 (empty ring track)

// ---------------------------------------------------------------------------
// SVG Donut chart
// ---------------------------------------------------------------------------

interface DonutSegment {
  rate: number;
  color: string;
}

function DonutChart({ summary }: { summary: GuestTrackingSummary }) {
  const size = 116;
  const cx = size / 2;
  const cy = size / 2;
  const r = 42;
  const sw = 14; // stroke width
  const circumference = 2 * Math.PI * r;

  const segments: DonutSegment[] =
    summary.total > 0
      ? [
          { rate: summary.inHotelRate,    color: COLOR_IN },
          { rate: summary.outOfHotelRate, color: COLOR_OUT },
          { rate: summary.unknownRate,    color: COLOR_UNKNOWN },
        ]
      : [];

  let cumulativeAngle = -90; // start at top (12 o'clock)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-label={`Guest presence: ${summary.inHotel} in hotel, ${summary.outOfHotel} out, ${summary.unknown} unknown`}
    >
      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={COLOR_TRACK}
        strokeWidth={sw}
      />

      {/* Donut segments */}
      {segments.map((seg, i) => {
        if (seg.rate <= 0) return null;
        const dashLen = seg.rate * circumference;
        const rotation = cumulativeAngle;
        cumulativeAngle += seg.rate * 360;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={sw}
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}

      {/* Center: total number */}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: "22px",
          fontWeight: 700,
          fill: "#18181b",
          fontFamily: "inherit",
        }}
      >
        {summary.total}
      </text>

      {/* Center: "GUESTS" label */}
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: "8.5px",
          fontWeight: 600,
          fill: "#a1a1aa",
          fontFamily: "inherit",
          letterSpacing: "0.08em",
        }}
      >
        {summary.total === 1 ? "GUEST" : "GUESTS"}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Legend row
// ---------------------------------------------------------------------------

function LegendItem({
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
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-[13px] font-semibold text-zinc-800 tabular-nums leading-none">
        {count}
      </span>
      <span className="text-[11px] text-zinc-400 leading-none">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manager stat row
// ---------------------------------------------------------------------------

interface ManagerStats {
  total: number;
  newToday: number;
  roomsOccupied: number;
}

function ManagerStatRow({ stats }: { stats: ManagerStats }) {
  return (
    <div className="flex items-center gap-4 pt-0.5">
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
          Today
        </p>
        <p className="text-base font-semibold text-zinc-900 leading-tight mt-0.5">
          {stats.newToday}
        </p>
      </div>
      <div className="w-px h-6 bg-zinc-100" />
      <div>
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
          Rooms
        </p>
        <p className="text-base font-semibold text-zinc-900 leading-tight mt-0.5">
          {stats.roomsOccupied}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

interface GuestsOverviewCardProps {
  summary: GuestTrackingSummary;
  isRefreshing: boolean;
  onRefresh: () => void;
  /** Only provided for manager role. */
  managerStats?: ManagerStats;
}

export function GuestsOverviewCard({
  summary,
  isRefreshing,
  onRefresh,
  managerStats,
}: GuestsOverviewCardProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm shadow-zinc-100/60 px-5 pt-4 pb-5">

      {/* ── Card header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
          Presence Overview
        </p>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh tracking data"
          aria-label="Refresh tracking data"
          className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 active:scale-90 disabled:opacity-40 transition-all touch-manipulation"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 transition-transform duration-500 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* ── Content row: left legend + right donut ─────────── */}
      <div className="flex items-center gap-5">

        {/* Left: stat + legend */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {managerStats && <ManagerStatRow stats={managerStats} />}

          {/* Tracking legend */}
          <div
            className={`flex flex-col gap-2 ${
              managerStats ? "mt-1 pt-3 border-t border-zinc-50" : ""
            }`}
          >
            {summary.total === 0 ? (
              <p className="text-xs text-zinc-300 italic">No guests yet</p>
            ) : !summary.hasTrackingData ? (
              <p className="text-[11px] text-zinc-300 leading-snug">
                Tracking not yet active.
                <br />
                Guests send presence on login.
              </p>
            ) : (
              <>
                <LegendItem color={COLOR_IN}      count={summary.inHotel}    label="in hotel"     />
                <LegendItem color={COLOR_OUT}     count={summary.outOfHotel} label="out of hotel"  />
                <LegendItem color={COLOR_UNKNOWN} count={summary.unknown}    label="unknown"      />
              </>
            )}
          </div>
        </div>

        {/* Right: donut chart */}
        <DonutChart summary={summary} />
      </div>
    </div>
  );
}
