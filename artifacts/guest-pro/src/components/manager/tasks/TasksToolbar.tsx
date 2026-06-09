/**
 * TasksToolbar — icon + small label controls.
 */

import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Search,
  X,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { TasksViewMode, TaskStatusFilter } from "@/lib/tasks-schedule";
import { tasksCard, tasksIconBtn } from "@/lib/tasks-ui";
import { Input } from "@/components/ui/input";
import { TasksIconChip } from "@/components/manager/tasks/TasksIconChip";
import { TasksStatusFilter } from "@/components/manager/tasks/TasksStatusFilter";

interface TasksToolbarProps {
  t: StaffTranslations;
  viewMode: TasksViewMode;
  onViewModeChange: (mode: TasksViewMode) => void;
  title: string;
  search: string;
  onSearchChange: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  statusFilter: TaskStatusFilter;
  onStatusFilterChange: (filter: TaskStatusFilter) => void;
}

export function TasksToolbar({
  t,
  viewMode,
  onViewModeChange,
  title,
  search,
  onSearchChange,
  onPrev,
  onNext,
  onToday,
  onCreate,
  onExport,
  exportDisabled,
  statusFilter,
  onStatusFilterChange,
}: TasksToolbarProps) {
  return (
    <div className={cn(tasksCard, "space-y-2.5 p-3")}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          className={tasksIconBtn}
          aria-label={viewMode === "day" ? t.tasksPrevDay : t.tasksPrevWeek}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="min-w-0 flex-1 rounded-xl bg-slate-50/90 px-2 py-2 text-center ring-1 ring-slate-100 transition-colors hover:bg-slate-100/80 touch-manipulation"
        >
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
            {viewMode === "day" ? t.tasksDayShort : t.tasksWeekShort}
          </p>
          <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
        </button>

        <button
          type="button"
          onClick={onNext}
          className={tasksIconBtn}
          aria-label={viewMode === "day" ? t.tasksNextDay : t.tasksNextWeek}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TasksIconChip
          icon={CalendarDays}
          label={t.tasksDayShort}
          active={viewMode === "day"}
          activeClass="bg-sky-500 text-white ring-sky-400"
          onClick={() => onViewModeChange("day")}
          aria-label={t.tasksDayView}
          aria-pressed={viewMode === "day"}
        />
        <TasksIconChip
          icon={CalendarRange}
          label={t.tasksWeekShort}
          active={viewMode === "week"}
          activeClass="bg-violet-500 text-white ring-violet-400"
          onClick={() => onViewModeChange("week")}
          aria-label={t.tasksWeekView}
          aria-pressed={viewMode === "week"}
        />
        <TasksIconChip
          icon={FileSpreadsheet}
          label={t.tasksExportShort}
          iconClass="text-emerald-600"
          inactiveClass="bg-emerald-50/80 text-emerald-700 ring-emerald-200/70 hover:bg-emerald-50"
          disabled={exportDisabled}
          onClick={onExport}
          aria-label={t.tasksExportExcel}
        />
        <TasksIconChip
          icon={Plus}
          label={t.tasksNewShort}
          active
          activeClass="bg-slate-800 text-white ring-slate-700"
          onClick={onCreate}
          aria-label={t.tasksNewTask}
        />
      </div>

      <div className="flex items-center gap-2">
        <TasksStatusFilter value={statusFilter} onChange={onStatusFilterChange} t={t} />
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t.tasksSearchPlaceholder}
            placeholder={t.tasksSearchShort}
            className="h-9 rounded-xl border-slate-200/80 bg-slate-50/50 pl-8 pr-7 text-sm shadow-none ring-1 ring-slate-100 focus-visible:ring-sky-300"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-700"
              aria-label={t.clearSearch}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
