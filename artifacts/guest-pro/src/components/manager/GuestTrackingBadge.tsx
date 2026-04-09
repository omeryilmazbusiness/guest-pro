/**
 * GuestTrackingBadge — presence status indicator for GuestCard.
 *
 * A compact, premium indicator showing the guest's current tracking status.
 * Uses coloured dots with short labels. Intentionally understated.
 */

import type { TrackingStatus } from "@/lib/tracking";

interface GuestTrackingBadgeProps {
  status: TrackingStatus;
  /** When true, renders only the dot (no label text). */
  compact?: boolean;
}

const CONFIG: Record<
  TrackingStatus,
  { dotClass: string; label: string; title: string }
> = {
  IN_HOTEL_AND_ON_WIFI: {
    dotClass: "bg-emerald-500",
    label: "In hotel",
    title: "In hotel · on hotel network",
  },
  IN_HOTEL_NOT_ON_WIFI: {
    dotClass: "bg-amber-400",
    label: "In hotel",
    title: "In hotel · not on hotel network",
  },
  OUTSIDE_HOTEL: {
    dotClass: "bg-rose-500",
    label: "Out of hotel",
    title: "Outside hotel",
  },
  UNKNOWN: {
    dotClass: "bg-zinc-300",
    label: "Unknown",
    title: "Location unknown",
  },
};

export function GuestTrackingBadge({
  status,
  compact = false,
}: GuestTrackingBadgeProps) {
  const cfg = CONFIG[status];

  if (compact) {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${cfg.dotClass} shrink-0`}
        title={cfg.title}
        aria-label={cfg.title}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={cfg.title}
      aria-label={cfg.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass} shrink-0`} />
      <span className="text-[10px] font-medium text-zinc-500 leading-none">
        {cfg.label}
      </span>
    </span>
  );
}
