/**
 * TaskTimelineBar — absolutely positioned task block on a time axis.
 */

import { cn } from "@/lib/utils";
import type { StaffTask } from "@/lib/tasks";
import { formatTaskTimeRange } from "@/lib/tasks-schedule";
import { TASK_LANE_HEIGHT_PX } from "@/lib/tasks-schedule";

interface TaskTimelineBarProps {
  task: StaffTask;
  leftPct: number;
  widthPct: number;
  lane: number;
  locale: string;
  onClick: (task: StaffTask) => void;
  /** Compact mode for weekly day cells */
  dense?: boolean;
}

export function TaskTimelineBar({
  task,
  leftPct,
  widthPct,
  lane,
  locale,
  onClick,
  dense,
}: TaskTimelineBarProps) {
  const timeLabel = formatTaskTimeRange(task, locale);
  const showTime = widthPct >= 12 && !dense;
  const top = lane * TASK_LANE_HEIGHT_PX + (dense ? 2 : 4);
  const height = TASK_LANE_HEIGHT_PX - (dense ? 4 : 6);

  return (
    <button
      type="button"
      title={`${task.title} · ${timeLabel}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}
      className={cn(
        "absolute z-[1] overflow-hidden rounded-md border text-left shadow-sm transition-transform touch-manipulation",
        "active:scale-[0.98] hover:z-[2] hover:shadow-md",
        task.isOverdue
          ? "border-red-300/80 bg-red-500 text-white"
          : task.status === "completed"
            ? "border-zinc-200 bg-zinc-200/90 text-zinc-500"
            : task.status === "in_progress"
              ? "border-zinc-700 bg-zinc-900 text-white"
              : "border-zinc-300/80 bg-white text-zinc-900",
        dense ? "text-[9px] px-1 py-0.5" : "text-[10px] px-1.5 py-1",
      )}
      style={{
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        top,
        height,
        minWidth: dense ? 20 : 28,
      }}
    >
      <p
        className={cn(
          "font-semibold leading-tight truncate",
          task.status === "completed" && "line-through",
        )}
      >
        {task.title}
      </p>
      {showTime && (
        <p
          className={cn(
            "mt-0.5 truncate font-mono text-[9px] tabular-nums opacity-80",
            task.status === "in_progress" && "text-zinc-300",
          )}
        >
          {timeLabel}
        </p>
      )}
    </button>
  );
}
