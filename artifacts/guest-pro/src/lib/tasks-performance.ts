/**
 * Client-side task performance chart data from loaded tasks.
 */

import type { StaffTask } from "@/lib/tasks";
import { assigneeDisplayName } from "@/lib/tasks";

export interface TaskPerformanceChartPoint {
  name: string;
  fullName: string;
  onTimeRate: number;
  completed: number;
  assigned: number;
}

export function buildTaskPerformanceChart(tasks: StaffTask[]): TaskPerformanceChartPoint[] {
  const now = Date.now();
  const map = new Map<
    number,
    {
      fullName: string;
      assigned: number;
      completed: number;
      onTimeOrEarly: number;
    }
  >();

  for (const task of tasks) {
    if (task.status === "cancelled") continue;
    const id = task.assigneeUserId;
    if (!map.has(id)) {
      map.set(id, {
        fullName: assigneeDisplayName(task.assignee),
        assigned: 0,
        completed: 0,
        onTimeOrEarly: 0,
      });
    }
    const row = map.get(id)!;
    row.assigned++;

    if (task.status === "completed" && task.completedAt) {
      row.completed++;
      const endMs = new Date(task.scheduledEndAt).getTime();
      const doneMs = new Date(task.completedAt).getTime();
      if (doneMs <= endMs) row.onTimeOrEarly++;
    } else if (
      task.status !== "completed" &&
      new Date(task.scheduledEndAt).getTime() < now
    ) {
      // overdue open — counted in assigned only for chart rate
    }
  }

  return Array.from(map.values())
    .map((row) => ({
      name: row.fullName.split(/\s+/)[0] ?? row.fullName,
      fullName: row.fullName,
      assigned: row.assigned,
      completed: row.completed,
      onTimeRate:
        row.completed > 0 ? Math.round((row.onTimeOrEarly / row.completed) * 100) : 0,
    }))
    .filter((row) => row.assigned > 0)
    .sort((a, b) => b.onTimeRate - a.onTimeRate || b.completed - a.completed);
}
