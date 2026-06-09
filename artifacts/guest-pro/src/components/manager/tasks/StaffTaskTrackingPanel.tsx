/**
 * StaffTaskTrackingPanel — department manager view of employee task completion.
 */

import { useMemo } from "react";
import { CheckCircle2, Clock, TimerOff } from "lucide-react";
import { assigneeDisplayName, type StaffTask } from "@/lib/tasks";

interface Props {
  tasks: StaffTask[];
}

interface EmployeeStats {
  assigneeId: number;
  name: string;
  employeeNumber: string | null;
  completed: number;
  pending: number;
  overdue: number;
}

export function StaffTaskTrackingPanel({ tasks }: Props) {
  const stats = useMemo(() => {
    const map = new Map<number, EmployeeStats>();

    for (const task of tasks) {
      const id = task.assigneeUserId;
      if (!map.has(id)) {
        map.set(id, {
          assigneeId: id,
          name: assigneeDisplayName(task.assignee),
          employeeNumber: null,
          completed: 0,
          pending: 0,
          overdue: 0,
        });
      }
      const entry = map.get(id)!;
      if (task.status === "completed") entry.completed++;
      else {
        entry.pending++;
        if (task.isOverdue) entry.overdue++;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.overdue - a.overdue || b.pending - a.pending);
  }, [tasks]);

  if (stats.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Team Progress Today</h3>
        <p className="text-[11px] text-zinc-400">Who completed, who is waiting, who is overdue</p>
      </div>
      <div className="space-y-2">
        {stats.map((emp) => (
          <div
            key={emp.assigneeId}
            className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2.5"
          >
            <p className="text-[13px] font-medium text-zinc-800 truncate">{emp.name}</p>
            <div className="flex items-center gap-3 text-[11px] shrink-0">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                {emp.completed}
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="w-3 h-3" />
                {emp.pending}
              </span>
              {emp.overdue > 0 && (
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  <TimerOff className="w-3 h-3" />
                  {emp.overdue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
