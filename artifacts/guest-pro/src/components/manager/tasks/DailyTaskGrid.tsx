/**
 * DailyTaskGrid — employees × continuous timeline (Gantt-style bars by start/end).
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { StaffTask } from "@/lib/tasks";
import {
  getHourSlots,
  formatHour,
  layoutDayTaskBars,
  tasksOnDayForAssignee,
  HOUR_COLUMN_PX,
  TASK_LANE_HEIGHT_PX,
  TASK_ROW_MIN_HEIGHT_PX,
  type GridEmployee,
} from "@/lib/tasks-schedule";
import { TaskTimelineBar } from "@/components/manager/tasks/TaskTimelineBar";

interface DailyTaskGridProps {
  day: Date;
  employees: GridEmployee[];
  tasks: StaffTask[];
  locale: string;
  onTaskClick: (task: StaffTask) => void;
}

function HourGridLines({ hourCount }: { hourCount: number }) {
  return (
    <>
      {Array.from({ length: hourCount + 1 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "pointer-events-none absolute top-0 bottom-0 border-l",
            i === 0 ? "border-zinc-200/80" : "border-zinc-100/90",
          )}
          style={{ left: `${(i / hourCount) * 100}%` }}
        />
      ))}
    </>
  );
}

export function DailyTaskGrid({
  day,
  employees,
  tasks,
  locale,
  onTaskClick,
}: DailyTaskGridProps) {
  const hours = useMemo(() => getHourSlots(), []);
  const hourCount = hours.length;
  const timelineWidth = hourCount * HOUR_COLUMN_PX;

  const rowLayouts = useMemo(() => {
    return employees.map((emp) => {
      const dayTasks = tasksOnDayForAssignee(tasks, emp.id, day);
      const { bars, laneCount } = layoutDayTaskBars(dayTasks, day);
      const rowHeight = Math.max(
        TASK_ROW_MIN_HEIGHT_PX,
        laneCount * TASK_LANE_HEIGHT_PX + 8,
      );
      return { emp, bars, rowHeight };
    });
  }, [employees, tasks, day]);

  if (employees.length === 0) return null;

  const gridCols = `5.75rem repeat(${hourCount}, ${HOUR_COLUMN_PX}px)`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <div
        className="grid min-w-max"
        style={{ gridTemplateColumns: gridCols }}
        role="table"
        aria-label="Daily task schedule"
      >
        {/* Header */}
        <div
          className="sticky left-0 z-20 border-b border-zinc-100 bg-zinc-50/95 px-2 py-2 backdrop-blur-sm"
          role="columnheader"
        />
        {hours.map((h) => (
          <div
            key={h}
            role="columnheader"
            className="border-b border-l border-zinc-100 bg-zinc-50/95 px-0.5 py-2 text-center text-[10px] font-semibold tabular-nums text-zinc-500"
          >
            {formatHour(h, locale)}
          </div>
        ))}

        {/* Rows */}
        {rowLayouts.map(({ emp, bars, rowHeight }, rowIdx) => (
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
            <div
              role="gridcell"
              className={cn(
                "relative border-b border-l border-zinc-50 bg-[linear-gradient(to_bottom,transparent_0,transparent_100%)]",
                rowIdx === rowLayouts.length - 1 && "rounded-br-2xl",
              )}
              style={{
                gridColumn: `2 / span ${hourCount}`,
                width: timelineWidth,
                minWidth: timelineWidth,
                height: rowHeight,
              }}
            >
              <HourGridLines hourCount={hourCount} />
              {bars.map((bar) => (
                <TaskTimelineBar
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
          </div>
        ))}
      </div>
    </div>
  );
}
