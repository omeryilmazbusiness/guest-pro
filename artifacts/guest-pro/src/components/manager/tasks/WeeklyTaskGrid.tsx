/**
 * WeeklyTaskGrid — one card per weekday with expandable tables.
 */

import { useMemo } from "react";
import { ClipboardList, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { StaffTask } from "@/lib/tasks";
import {
  formatDayHeading,
  groupTasksByWeekDay,
  isToday,
  startOfWeek,
  type GridEmployee,
} from "@/lib/tasks-schedule";
import { tasksCard } from "@/lib/tasks-ui";
import { EmployeeTimelineTable } from "@/components/manager/tasks/EmployeeTimelineTable";
import { TaskTimelineTable } from "@/components/manager/tasks/TaskTimelineTable";
import { TasksTableSection } from "@/components/manager/tasks/TasksTableSection";

interface WeeklyTaskGridProps {
  weekAnchor: Date;
  employees: GridEmployee[];
  tasks: StaffTask[];
  locale: string;
  t: StaffTranslations;
  onTaskClick: (task: StaffTask) => void;
}

export function WeeklyTaskGrid({
  weekAnchor,
  employees,
  tasks,
  locale,
  t,
  onTaskClick,
}: WeeklyTaskGridProps) {
  const weekStart = useMemo(() => startOfWeek(weekAnchor), [weekAnchor]);

  const days = useMemo(
    () => groupTasksByWeekDay(tasks, weekStart).map(({ day }) => day),
    [tasks, weekStart],
  );

  if (employees.length === 0) return null;

  return (
    <div className="space-y-3" aria-label={t.tasksWeekView}>
      {days.map((day) => {
        const today = isToday(day);
        const dayLabel = formatDayHeading(day, locale);

        return (
          <section key={day.toISOString()} className={cn(tasksCard, "overflow-hidden")}>
            <header
              className={cn(
                "border-b px-3 py-2.5 sm:px-3.5",
                today
                  ? "border-sky-100 bg-sky-50/90"
                  : "border-slate-100 bg-slate-50/50",
              )}
            >
              <h3
                className={cn(
                  "text-[13px] font-semibold tracking-tight",
                  today ? "text-sky-900" : "text-slate-700",
                )}
              >
                {dayLabel}
              </h3>
            </header>

            <div className="space-y-0 p-2 sm:p-2.5">
              <TasksTableSection
                shell={false}
                borderAccent={false}
                icon={Users}
                title={t.tasksScheduleEmployeeShort}
                modalTitle={`${dayLabel} · ${t.tasksScheduleByEmployee}`}
                accent="sky"
                t={t}
                renderContent={({ embedded, expanded }) => (
                  <EmployeeTimelineTable
                    day={day}
                    employees={employees}
                    tasks={tasks}
                    locale={locale}
                    t={t}
                    onTaskClick={onTaskClick}
                    embedded={embedded}
                    expanded={expanded}
                    ariaLabel={`${dayLabel} — ${t.tasksScheduleByEmployee}`}
                  />
                )}
              />
              <div className="my-2 border-t border-slate-100" />
              <TasksTableSection
                shell={false}
                borderAccent={false}
                icon={ClipboardList}
                title={t.tasksScheduleTaskShort}
                modalTitle={`${dayLabel} · ${t.tasksScheduleByTask}`}
                accent="violet"
                t={t}
                renderContent={({ embedded, expanded }) => (
                  <TaskTimelineTable
                    day={day}
                    tasks={tasks}
                    locale={locale}
                    t={t}
                    onTaskClick={onTaskClick}
                    embedded={embedded}
                    expanded={expanded}
                    ariaLabel={`${dayLabel} — ${t.tasksScheduleByTask}`}
                  />
                )}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
