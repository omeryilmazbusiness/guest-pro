/**
 * OverdueTaskList — expandable list with task actions on tap.
 */

import { AlertCircle, Clock, User } from "lucide-react";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { StaffTask } from "@/lib/tasks";
import { assigneeDisplayName } from "@/lib/tasks";
import { TasksTableSection } from "@/components/manager/tasks/TasksTableSection";

interface OverdueTaskListProps {
  tasks: StaffTask[];
  t: StaffTranslations;
  locale: string;
  onTaskClick: (task: StaffTask) => void;
}

function OverdueTaskRows({
  tasks,
  locale,
  onTaskClick,
  spacious = false,
}: {
  tasks: StaffTask[];
  locale: string;
  onTaskClick: (task: StaffTask) => void;
  spacious?: boolean;
}) {
  return (
    <ul className={spacious ? "space-y-2" : "space-y-1"}>
      {tasks.map((task) => {
        const end = new Date(task.scheduledEndAt);
        const timeStr = end.toLocaleString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        });
        const assignee = assigneeDisplayName(task.assignee);
        return (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onTaskClick(task)}
              className={
                spacious
                  ? "flex w-full items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-3 text-left transition-colors hover:bg-rose-50 active:scale-[0.99] touch-manipulation"
                  : "flex w-full items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 px-2.5 py-2 text-left transition-colors hover:bg-rose-50 active:scale-[0.99] touch-manipulation"
              }
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p
                  className={
                    spacious
                      ? "truncate text-[15px] font-semibold text-rose-950"
                      : "truncate text-[13px] font-semibold text-rose-950"
                  }
                >
                  {task.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-rose-700/80">
                  <User className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{assignee}</span>
                </p>
              </div>
              <span className="flex shrink-0 flex-col items-end gap-0.5 text-rose-600">
                <Clock className="h-3 w-3" aria-hidden />
                <span className="text-[10px] font-semibold tabular-nums leading-none">{timeStr}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function OverdueTaskList({ tasks, t, locale, onTaskClick }: OverdueTaskListProps) {
  if (tasks.length === 0) return null;

  return (
    <TasksTableSection
      icon={AlertCircle}
      title={t.tasksOverdueShort}
      modalTitle={t.tasksOverdueTitle}
      accent="rose"
      badge={tasks.length}
      t={t}
      showScrollHint={false}
      renderContent={({ expanded }) => (
        <OverdueTaskRows
          tasks={tasks}
          locale={locale}
          onTaskClick={onTaskClick}
          spacious={expanded}
        />
      )}
    />
  );
}
