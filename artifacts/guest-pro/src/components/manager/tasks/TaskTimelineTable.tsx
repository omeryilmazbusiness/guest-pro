/**
 * TaskTimelineTable — hourly grid with tasks in the left column.
 * Includes an hour-by-hour assignment summary row under the time headers.
 */

import { ClipboardList, Users } from "lucide-react";
import { useMemo } from "react";
import { TasksTableHeaderIcon } from "@/components/manager/tasks/TasksIconChip";
import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { StaffTask } from "@/lib/tasks";
import { resolveTaskDisplayStatus } from "@/lib/task-status-visual";
import {
  buildHourAssignmentMap,
  DAILY_TIMELINE_COLUMN_PX,
  DAILY_TIMELINE_SLOT_COUNT,
  formatHourColumnLabel,
  getDailyTimelineHours,
  getTaskBarInDailyTimeline,
  tasksForDay,
} from "@/lib/tasks-schedule";
import {
  tasksTableOuter,
  tasksTableStickyCol,
  tasksTableHeaderCell,
  tasksTableHourCell,
} from "@/lib/tasks-ui";
import { TimelineTaskBlock } from "@/components/manager/tasks/TimelineTaskBlock";

const TASK_COL_WIDTH = "9rem";
const ROW_HEIGHT = 44;

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  in_progress: "bg-blue-500",
  overdue: "bg-red-500",
  completed: "bg-emerald-500",
  cancelled: "bg-zinc-300",
};

export interface TaskTimelineTableProps {
  day: Date;
  tasks: StaffTask[];
  locale: string;
  t: StaffTranslations;
  onTaskClick: (task: StaffTask) => void;
  ariaLabel?: string;
  embedded?: boolean;
  expanded?: boolean;
}

export function TaskTimelineTable({
  day,
  tasks,
  locale,
  t,
  onTaskClick,
  ariaLabel,
  embedded = false,
  expanded = false,
}: TaskTimelineTableProps) {
  const hours = useMemo(() => getDailyTimelineHours(), []);
  const hourColPx = expanded ? 54 : DAILY_TIMELINE_COLUMN_PX;
  const taskCol = expanded ? "11rem" : TASK_COL_WIDTH;

  const dayTasks = useMemo(() => tasksForDay(tasks, day), [tasks, day]);

  const hourAssignments = useMemo(
    () => buildHourAssignmentMap(tasks, day),
    [tasks, day],
  );

  const tableMinWidth = `calc(${taskCol} + ${hours.length * hourColPx}px)`;

  return (
    <div className={cn(tasksTableOuter, embedded ? "rounded-lg border-0 bg-transparent" : "")}>
      <table
        className="w-max min-w-full border-separate border-spacing-0"
        style={{ minWidth: tableMinWidth }}
        aria-label={ariaLabel ?? t.tasksScheduleByTask}
      >
        <colgroup>
          <col style={{ width: taskCol, minWidth: taskCol }} />
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
                icon={ClipboardList}
                label={t.tasksScheduleTaskShort}
                iconClass="text-violet-600"
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
          <tr>
            <th
              scope="row"
              className={cn(
                tasksTableStickyCol,
                "z-30 border-b border-indigo-100/80 bg-indigo-50/50 p-0",
              )}
            >
              <TasksTableHeaderIcon
                icon={Users}
                label={t.tasksHourAssignShort}
                iconClass="text-indigo-500"
              />
            </th>
            {hours.map((h, i) => {
              const entries = hourAssignments.get(h) ?? [];
              return (
                <td
                  key={h}
                  className={cn(
                    "border-b border-l border-indigo-100/60 bg-indigo-50/30 align-top p-1",
                    i === 0 && "border-l",
                  )}
                >
                  {entries.length === 0 ? (
                    <span className="block min-h-[1.25rem] text-center text-[8px] text-zinc-300">
                      —
                    </span>
                  ) : (
                    <ul className="space-y-0.5">
                      {entries.map((entry) => (
                        <li
                          key={`${entry.taskId}-${h}`}
                          className="truncate rounded bg-indigo-100/80 px-0.5 text-[8px] font-medium leading-tight text-indigo-900"
                          title={`${entry.taskTitle} · ${entry.assigneeName}`}
                        >
                          {entry.assigneeName}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {dayTasks.length === 0 ? (
            <tr>
              <td
                colSpan={DAILY_TIMELINE_SLOT_COUNT + 1}
                className="border-b border-slate-100/80 px-4 py-6 text-center text-slate-200"
              >
                —
              </td>
            </tr>
          ) : (
            dayTasks.map((task, rowIdx) => {
              const bar = getTaskBarInDailyTimeline(task, day);
              const displayStatus = resolveTaskDisplayStatus(task);

              return (
                <tr key={task.id}>
                  <td
                    className={cn(
                      tasksTableStickyCol,
                      "border-b px-3 py-2",
                      rowIdx % 2 === 1 && "bg-slate-50/60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          STATUS_DOT[displayStatus] ?? "bg-zinc-300",
                        )}
                        aria-hidden
                      />
                      <span className="line-clamp-2 text-[12px] font-medium leading-snug text-slate-800">
                        {task.title}
                      </span>
                    </div>
                  </td>
                  <td
                    colSpan={DAILY_TIMELINE_SLOT_COUNT}
                    className={cn(
                      "relative border-b border-slate-100/80 p-0 align-top",
                      rowIdx % 2 === 1 ? "bg-slate-50/25" : "bg-white",
                    )}
                    style={{ height: ROW_HEIGHT }}
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
                      {bar ? (
                        <TimelineTaskBlock
                          task={task}
                          leftPct={bar.leftPct}
                          widthPct={bar.widthPct}
                          lane={0}
                          locale={locale}
                          onClick={onTaskClick}
                          primaryLabel="assignee"
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
