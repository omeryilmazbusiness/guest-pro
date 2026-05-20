/**
 * TaskChip — compact task block in schedule grids.
 */

import { cn } from "@/lib/utils";
import type { StaffTask } from "@/lib/tasks";

interface TaskChipProps {
  task: StaffTask;
  onClick: (task: StaffTask) => void;
  compact?: boolean;
}

export function TaskChip({ task, onClick, compact }: TaskChipProps) {
  const start = new Date(task.scheduledStartAt);
  const end = new Date(task.scheduledEndAt);
  const timeLabel = `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className={cn(
        "w-full rounded-lg border px-1.5 py-1 text-left transition-transform active:scale-[0.98] touch-manipulation",
        task.isOverdue
          ? "border-red-200 bg-red-50 text-red-900"
          : task.status === "completed"
            ? "border-zinc-200 bg-zinc-100 text-zinc-500 line-through"
            : task.status === "in_progress"
              ? "border-zinc-300 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-900 shadow-sm",
        compact ? "text-[10px]" : "text-[11px]",
      )}
    >
      <p className="font-semibold truncate leading-tight">{task.title}</p>
      {!compact && (
        <p className={cn("mt-0.5 truncate opacity-70", task.status === "in_progress" && "text-zinc-300")}>
          {timeLabel}
        </p>
      )}
    </button>
  );
}
