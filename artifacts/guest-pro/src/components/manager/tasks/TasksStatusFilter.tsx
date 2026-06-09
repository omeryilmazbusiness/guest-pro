/**
 * TasksStatusFilter — icon + tiny label chips.
 */

import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { TaskStatusFilter } from "@/lib/tasks-schedule";
import { FILTER_DOT, STATUS_FILTER_CONFIG, tasksChipBtn, tasksChipLabel } from "@/lib/tasks-ui";

const FILTERS: TaskStatusFilter[] = [
  "all",
  "pending",
  "in_progress",
  "completed",
  "overdue",
];

interface TasksStatusFilterProps {
  value: TaskStatusFilter;
  onChange: (value: TaskStatusFilter) => void;
  t: StaffTranslations;
}

export function TasksStatusFilter({ value, onChange, t }: TasksStatusFilterProps) {
  return (
    <div
      className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label={t.tasksFilterAll}
    >
      {FILTERS.map((filter) => {
        const active = value === filter;
        const { icon: Icon, activeClass, label, aria } = STATUS_FILTER_CONFIG[filter];
        const dotClass = FILTER_DOT[filter];

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            aria-pressed={active}
            aria-label={aria(t)}
            title={aria(t)}
            className={cn(
              tasksChipBtn,
              active
                ? cn(activeClass, "shadow-sm")
                : "bg-slate-50 text-slate-600 ring-slate-200/70 hover:bg-slate-100",
            )}
          >
            <Icon
              className={cn("h-3.5 w-3.5 shrink-0", !active && dotClass, filter === "pending" && !active && "fill-amber-100")}
              strokeWidth={filter === "pending" ? 2.5 : 2}
            />
            <span className={tasksChipLabel}>{label(t)}</span>
          </button>
        );
      })}
    </div>
  );
}
