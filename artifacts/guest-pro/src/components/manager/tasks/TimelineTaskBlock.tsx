/**
 * TimelineTaskBlock — task pill positioned inside an hourly timeline row.
 */

import { cn } from "@/lib/utils";
import type { StaffTask } from "@/lib/tasks";
import { assigneeDisplayName } from "@/lib/tasks";
import { taskBlockClassName } from "@/lib/task-status-visual";
import {
  formatTaskTimeRange,
  DAILY_TIMELINE_LANE_HEIGHT_PX,
} from "@/lib/tasks-schedule";

interface TimelineTaskBlockProps {
  task: StaffTask;
  leftPct: number;
  widthPct: number;
  lane: number;
  locale: string;
  onClick: (task: StaffTask) => void;
  /** Show assignee name on the bar instead of the task title (task-centric grid). */
  primaryLabel?: "title" | "assignee";
}

export function TimelineTaskBlock({
  task,
  leftPct,
  widthPct,
  lane,
  locale,
  onClick,
  primaryLabel = "title",
}: TimelineTaskBlockProps) {
  const timeLabel = formatTaskTimeRange(task, locale);
  const top = lane * DAILY_TIMELINE_LANE_HEIGHT_PX + 4;
  const height = DAILY_TIMELINE_LANE_HEIGHT_PX - 4;
  const narrow = widthPct < 4;
  const primaryText =
    primaryLabel === "assignee" ? assigneeDisplayName(task.assignee) : task.title;

  return (
    <button
      type="button"
      title={`${task.title} · ${assigneeDisplayName(task.assignee)} · ${timeLabel}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}
      className={cn(
        "absolute z-[1] overflow-hidden rounded-lg border px-1.5 text-left shadow-sm transition-all touch-manipulation",
        "hover:z-[2] hover:shadow-md active:scale-[0.99]",
        taskBlockClassName(task),
        task.status === "completed" && "opacity-90",
      )}
      style={{
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        top,
        height,
      }}
    >
      <p
        className={cn(
          "truncate text-[10px] font-semibold leading-tight",
          task.status === "completed" && "line-through opacity-80",
        )}
      >
        {primaryText}
      </p>
      {!narrow && primaryLabel === "title" && (
        <p className="truncate text-[9px] tabular-nums opacity-75">{timeLabel}</p>
      )}
      {!narrow && primaryLabel === "assignee" && (
        <p className="truncate text-[9px] opacity-75">{timeLabel}</p>
      )}
    </button>
  );
}
