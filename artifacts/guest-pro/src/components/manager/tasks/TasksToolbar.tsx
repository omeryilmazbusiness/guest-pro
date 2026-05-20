/**
 * TasksToolbar — date navigation, day/week toggle, search, create.
 */

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { TasksViewMode } from "@/lib/tasks-schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}: TasksToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-50 touch-manipulation"
          aria-label={viewMode === "day" ? t.tasksPrevDay : t.tasksPrevWeek}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="flex-1 min-w-0 rounded-xl bg-white border border-zinc-100 px-3 py-2 text-left touch-manipulation hover:bg-zinc-50"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            {viewMode === "day" ? t.tasksDayView : t.tasksWeekView}
          </p>
          <p className="text-sm font-semibold text-zinc-900 truncate">{title}</p>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-50 touch-manipulation"
          aria-label={viewMode === "day" ? t.tasksNextDay : t.tasksNextWeek}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 rounded-2xl bg-zinc-100/90 p-1">
        <button
          type="button"
          onClick={() => onViewModeChange("day")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-colors touch-manipulation",
            viewMode === "day"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700",
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {t.tasksDayView}
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("week")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-colors touch-manipulation",
            viewMode === "week"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700",
          )}
        >
          <CalendarRange className="h-3.5 w-3.5" />
          {t.tasksWeekView}
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.tasksSearchPlaceholder}
            className="h-10 rounded-2xl border-zinc-200 bg-white pl-9 pr-8 text-sm shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              aria-label={t.clearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={onCreate}
          size="sm"
          className="h-10 shrink-0 rounded-2xl px-3.5 shadow-sm shadow-zinc-900/10"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-1.5">{t.tasksNewTask}</span>
        </Button>
      </div>
    </div>
  );
}
