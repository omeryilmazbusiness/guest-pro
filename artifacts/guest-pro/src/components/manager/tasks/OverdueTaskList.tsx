/**
 * OverdueTaskList — red-highlighted overdue tasks below the schedule grid.
 */

import { AlertCircle } from "lucide-react";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { StaffTask } from "@/lib/tasks";
import { assigneeDisplayName } from "@/lib/tasks";

interface OverdueTaskListProps {
  tasks: StaffTask[];
  t: StaffTranslations;
  locale: string;
  onTaskClick: (task: StaffTask) => void;
}

export function OverdueTaskList({ tasks, t, locale, onTaskClick }: OverdueTaskListProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <h3 className="text-sm font-semibold text-red-700">{t.tasksOverdueTitle}</h3>
        <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-red-700">
          {tasks.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {tasks.map((task) => {
          const end = new Date(task.scheduledEndAt);
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onTaskClick(task)}
                className="flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-left transition-colors hover:bg-red-100/80 active:scale-[0.99] touch-manipulation"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-900 truncate">{task.title}</p>
                  <p className="text-xs text-red-700/80 mt-0.5">
                    {assigneeDisplayName(task.assignee)} ·{" "}
                    {end.toLocaleString(locale, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
