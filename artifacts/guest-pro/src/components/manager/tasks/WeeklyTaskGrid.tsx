/**
 * WeeklyTaskGrid — employees × days; each day shows intra-day time bars.
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { StaffTask } from "@/lib/tasks";
import {
  addDays,
  formatDayLabel,
  layoutDayTaskBars,
  startOfWeek,
  tasksOnDayForAssignee,
  TASK_LANE_HEIGHT_PX,
  TASK_ROW_MIN_HEIGHT_PX,
  type GridEmployee,
} from "@/lib/tasks-schedule";
import { TaskTimelineBar } from "@/components/manager/tasks/TaskTimelineBar";

interface WeeklyTaskGridProps {
  weekAnchor: Date;
  employees: GridEmployee[];
  tasks: StaffTask[];
  locale: string;
  onTaskClick: (task: StaffTask) => void;
}

const DAY_COL_MIN_PX = 88;

export function WeeklyTaskGrid({
  weekAnchor,
  employees,
  tasks,
  locale,
  onTaskClick,
}: WeeklyTaskGridProps) {
  const weekStart = useMemo(() => startOfWeek(weekAnchor), [weekAnchor]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const rowLayouts = useMemo(() => {
    return employees.map((emp) => {
      const dayCells = days.map((d) => {
        const dayTasks = tasksOnDayForAssignee(tasks, emp.id, d);
        const { bars, laneCount } = layoutDayTaskBars(dayTasks, d);
        const cellHeight = Math.max(
          TASK_ROW_MIN_HEIGHT_PX - 8,
          laneCount * TASK_LANE_HEIGHT_PX + 6,
        );
        return { day: d, bars, cellHeight };
      });
      const rowHeight = Math.max(
        TASK_ROW_MIN_HEIGHT_PX,
        ...dayCells.map((c) => c.cellHeight),
      );
      return { emp, dayCells, rowHeight };
    });
  }, [employees, tasks, days]);

  if (employees.length === 0) return null;

  const gridCols = `5.75rem repeat(7, minmax(${DAY_COL_MIN_PX}px, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <div
        className="grid min-w-[40rem] w-full"
        style={{ gridTemplateColumns: gridCols }}
        role="table"
        aria-label="Weekly task schedule"
      >
        <div className="sticky left-0 z-20 border-b border-zinc-100 bg-zinc-50/95 px-2 py-2" />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            role="columnheader"
            className="border-b border-l border-zinc-100 bg-zinc-50/95 px-1 py-2 text-center text-[10px] font-semibold text-zinc-600"
          >
            {formatDayLabel(d, locale)}
          </div>
        ))}

        {rowLayouts.map(({ emp, dayCells, rowHeight }, rowIdx) => (
          <div key={emp.id} className="contents" role="row">
            <div
              role="rowheader"
              className={cn(
                "sticky left-0 z-10 flex items-center border-b border-zinc-50 bg-white px-2 py-2",
                rowIdx === rowLayouts.length - 1 && "rounded-bl-2xl",
              )}
            >
              <span className="truncate text-[11px] font-semibold text-zinc-800">
                {emp.name}
              </span>
            </div>
            {dayCells.map(({ day, bars, cellHeight }) => (
              <div
                key={day.toISOString()}
                role="gridcell"
                className="relative border-b border-l border-zinc-50 bg-zinc-50/20"
                style={{ height: rowHeight, minHeight: rowHeight }}
              >
                <div
                  className="relative mx-0.5 mt-1 rounded-lg bg-white/60 ring-1 ring-zinc-100/80"
                  style={{ height: cellHeight }}
                >
                  {bars.map((bar) => (
                    <TaskTimelineBar
                      key={bar.task.id}
                      task={bar.task}
                      leftPct={bar.leftPct}
                      widthPct={bar.widthPct}
                      lane={bar.lane}
                      locale={locale}
                      onClick={onTaskClick}
                      dense
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
