/**
 * TaskStatusBadge — compact status pill for task tables.
 */

import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { TaskStatus } from "@/lib/tasks";
import { TASK_STATUS_FILTER_STYLES } from "@/lib/task-status-visual";

export function taskStatusLabel(status: TaskStatus, t: StaffTranslations): string {
  switch (status) {
    case "pending":
      return t.tasksStatusPending;
    case "in_progress":
      return t.tasksStatusInProgress;
    case "completed":
      return t.tasksStatusCompleted;
    case "cancelled":
      return t.tasksStatusCancelled;
  }
}

interface TaskStatusBadgeProps {
  status: TaskStatus;
  t: StaffTranslations;
  overdue?: boolean;
  className?: string;
}

export function TaskStatusBadge({ status, t, overdue, className }: TaskStatusBadgeProps) {
  const display = overdue && status !== "completed" ? "overdue" : status;
  const styles =
    display === "overdue"
      ? TASK_STATUS_FILTER_STYLES.overdue.idle
      : TASK_STATUS_FILTER_STYLES[display as keyof typeof TASK_STATUS_FILTER_STYLES]?.idle ??
        TASK_STATUS_FILTER_STYLES.all.idle;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
        styles,
        className,
      )}
    >
      {display === "overdue" ? t.tasksOverdueTitle : taskStatusLabel(status, t)}
    </span>
  );
}
