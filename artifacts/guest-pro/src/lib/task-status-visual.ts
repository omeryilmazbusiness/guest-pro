/**
 * Shared task status colors for timeline blocks and badges.
 */

import type { StaffTask, TaskStatus } from "@/lib/tasks";

export type TaskDisplayStatus = TaskStatus | "overdue";

export function resolveTaskDisplayStatus(task: StaffTask): TaskDisplayStatus {
  if (task.status === "completed" || task.status === "cancelled") return task.status;
  if (task.isOverdue) return "overdue";
  return task.status;
}

/** Timeline block / pill styles */
export function taskBlockClassName(task: StaffTask): string {
  const display = resolveTaskDisplayStatus(task);
  switch (display) {
    case "pending":
      return "border-amber-200/90 bg-amber-50/95 text-amber-950 shadow-amber-100/50";
    case "in_progress":
      return "border-blue-200/90 bg-blue-50/95 text-blue-950 shadow-blue-100/50";
    case "overdue":
      return "border-red-200/90 bg-red-50/95 text-red-900 shadow-red-100/50";
    case "completed":
      return "border-emerald-200/90 bg-emerald-50/95 text-emerald-900 shadow-emerald-100/50";
    case "cancelled":
      return "border-zinc-200 bg-zinc-100/80 text-zinc-500";
  }
}

/** Filter chip / badge styles */
export const TASK_STATUS_FILTER_STYLES: Record<
  "all" | TaskStatus | "overdue",
  { active: string; idle: string }
> = {
  all: {
    active: "bg-zinc-900 text-white border-zinc-900",
    idle: "bg-white text-zinc-600 border-zinc-100 hover:border-zinc-200",
  },
  pending: {
    active: "bg-amber-500 text-white border-amber-500",
    idle: "bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100/80",
  },
  in_progress: {
    active: "bg-blue-600 text-white border-blue-600",
    idle: "bg-blue-50 text-blue-800 border-blue-100 hover:bg-blue-100/80",
  },
  completed: {
    active: "bg-emerald-600 text-white border-emerald-600",
    idle: "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100/80",
  },
  overdue: {
    active: "bg-red-600 text-white border-red-600",
    idle: "bg-red-50 text-red-800 border-red-100 hover:bg-red-100/80",
  },
  cancelled: {
    active: "bg-zinc-600 text-white border-zinc-600",
    idle: "bg-zinc-50 text-zinc-600 border-zinc-100",
  },
};
