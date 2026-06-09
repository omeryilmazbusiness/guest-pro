/**
 * EmployeeTimelineTable — hourly grid 07:00 AM – 11:59 PM per day.
 * Used by Daily and Weekly task views.
 */

import { Users } from "lucide-react";
import { useMemo } from "react";
import { TasksTableHeaderIcon } from "@/components/manager/tasks/TasksIconChip";
import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { StaffTask } from "@/lib/tasks";
import {
  dailyTimelineRowHeight,
  DAILY_TIMELINE_COLUMN_PX,
  DAILY_TIMELINE_SLOT_COUNT,
  formatHourColumnLabel,
  getDailyTimelineHours,
  layoutTasksInDailyTimeline,
  sortTasksByStart,
  tasksOnDayForAssignee,
  type GridEmployee,
} from "@/lib/tasks-schedule";
import {
  tasksTableOuter,
  tasksTableStickyCol,
  tasksTableHeaderCell,
  tasksTableHourCell,
} from "@/lib/tasks-ui";
import { TimelineTaskBlock } from "@/components/manager/tasks/TimelineTaskBlock";

const EMPLOYEE_COL_WIDTH = "7.5rem";

export interface EmployeeTimelineTableProps {
  day: Date;
  employees: GridEmployee[];
  tasks: StaffTask[];
  locale: string;
  t: StaffTranslations;
  onTaskClick: (task: StaffTask) => void;
  ariaLabel?: string;
  /** Hide outer border when nested inside a week section. */
  embedded?: boolean;
  /** Wider columns when shown in expand popup. */
  expanded?: boolean;
}

export function EmployeeTimelineTable({
  day,
  employees,
  tasks,
  locale,
  t,
  onTaskClick,
  ariaLabel,
  embedded = false,
  expanded = false,
}: EmployeeTimelineTableProps) {
  const hours = useMemo(() => getDailyTimelineHours(), []);
  const hourColPx = expanded ? 54 : DAILY_TIMELINE_COLUMN_PX;
  const employeeCol = expanded ? "9rem" : EMPLOYEE_COL_WIDTH;

  const rows = useMemo(() => {
    return employees.map((emp) => {
      const dayTasks = sortTasksByStart(tasksOnDayForAssignee(tasks, emp.id, day));
      const { bars, laneCount } = layoutTasksInDailyTimeline(dayTasks, day);
      return { emp, dayTasks, bars, laneCount, rowHeight: dailyTimelineRowHeight(laneCount) };
    });
  }, [employees, tasks, day]);

  const tableMinWidth = `calc(${employeeCol} + ${hours.length * hourColPx}px)`;

  if (employees.length === 0) return null;

  return (
    <div
      className={cn(
        tasksTableOuter,
        embedded ? "rounded-lg border-0 bg-transparent" : "",
      )}
    >
      <table
        className="w-max min-w-full border-separate border-spacing-0"
        style={{ minWidth: tableMinWidth }}
        aria-label={ariaLabel ?? t.tasksTableDaySchedule}
      >
        <colgroup>
          <col style={{ width: employeeCol, minWidth: employeeCol }} />
          {hours.map((h) => (
            <col
              key={h}
              style={{
                width: `${hourColPx}px`,
                minWidth: `${hourColPx}px`,
              }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={cn(tasksTableStickyCol, tasksTableHeaderCell, "z-30 p-0")}>
              <TasksTableHeaderIcon
                icon={Users}
                label={t.tasksScheduleEmployeeShort}
                iconClass="text-sky-600"
              />
            </th>
            {hours.map((h, i) => {
              const label = formatHourColumnLabel(h, locale);
              const isLast = i === hours.length - 1;
              return (
                <th
                  key={h}
                  scope="col"
                  title={
                    isLast
                      ? `${label.hour}${label.period ? ` ${label.period}` : ""} – 11:59 PM`
                      : undefined
                  }
                  className={tasksTableHourCell}
                >
                  <div className="mx-auto flex w-[2.25rem] flex-col items-center leading-none">
                    <span className="text-[10px] font-semibold tabular-nums text-slate-600">
                      {label.hour}
                    </span>
                    {label.period ? (
                      <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-slate-400">
                        {label.period}
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ emp, dayTasks, bars, rowHeight }, rowIdx) => (
            <tr key={emp.id}>
              <td
                className={cn(
                  tasksTableStickyCol,
                  "border-b px-3 py-2 text-[12px] font-medium text-slate-800",
                  rowIdx % 2 === 1 && "bg-slate-50/60",
                )}
              >
                {emp.name}
              </td>
              <td
                colSpan={DAILY_TIMELINE_SLOT_COUNT}
                className={cn(
                  "relative border-b border-slate-100/80 p-0 align-top",
                  rowIdx % 2 === 1 ? "bg-slate-50/25" : "bg-white",
                )}
                style={{ height: rowHeight }}
              >
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${DAILY_TIMELINE_SLOT_COUNT}, 1fr)` }}
                  aria-hidden
                >
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className={cn(
                        "border-l border-slate-100/70",
                        i % 2 === 0 && "bg-slate-50/20",
                        i === 0 && "border-l-0",
                      )}
                    />
                  ))}
                </div>

                <div className="relative h-full w-full">
                  {bars.map((bar) => (
                    <TimelineTaskBlock
                      key={bar.task.id}
                      task={bar.task}
                      leftPct={bar.leftPct}
                      widthPct={bar.widthPct}
                      lane={bar.lane}
                      locale={locale}
                      onClick={onTaskClick}
                    />
                  ))}
                </div>

                {dayTasks.length === 0 && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-200">
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
