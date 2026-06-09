/**
 * TasksTab — manager task scheduling (daily / weekly tables + overdue list).
 */

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, SearchX } from "lucide-react";
import { toast } from "sonner";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { useOptionalHotelTenant } from "@/hooks/use-hotel-tenant";
import { listStaff } from "@/lib/staff";
import { listRoutineTasks } from "@/lib/routine-tasks";
import { exportTasksWorkbook } from "@/lib/tasks-export";
import {
  TASKS_QUERY_KEY,
  listTasks,
  type StaffTask,
} from "@/lib/tasks";
import { tasksCard } from "@/lib/tasks-ui";
import { cn } from "@/lib/utils";
import {
  addDays,
  filterTasksBySearch,
  filterTasksByStatus,
  formatAnchorTitle,
  getDayRangeISO,
  getOverdueTasks,
  getWeekRangeISO,
  staffToGridEmployees,
  type TaskStatusFilter,
  type TasksViewMode,
} from "@/lib/tasks-schedule";
import { TasksToolbar } from "@/components/manager/tasks/TasksToolbar";
import { DailyTaskGrid } from "@/components/manager/tasks/DailyTaskGrid";
import { WeeklyTaskGrid } from "@/components/manager/tasks/WeeklyTaskGrid";
import { OverdueTaskList } from "@/components/manager/tasks/OverdueTaskList";
import { RoutineTasksSection } from "@/components/manager/tasks/RoutineTasksSection";
import { CreateTaskSheet } from "@/components/manager/tasks/CreateTaskSheet";
import { TaskDetailSheet } from "@/components/manager/tasks/TaskDetailSheet";
import { TaskPerformanceSection } from "@/components/manager/tasks/TaskPerformanceSection";

export function TasksTab() {
  const { t, locale } = useStaffLocale();
  const tenant = useOptionalHotelTenant();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<TasksViewMode>("day");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null);

  const range = useMemo(() => {
    return viewMode === "day"
      ? getDayRangeISO(anchorDate)
      : getWeekRangeISO(anchorDate);
  }, [viewMode, anchorDate]);

  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: listStaff,
  });

  const {
    data: tasks = [],
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: [...TASKS_QUERY_KEY, range.from, range.to],
    queryFn: () => listTasks(range.from, range.to),
  });

  const { data: routines = [] } = useQuery({
    queryKey: ["routine-tasks"],
    queryFn: listRoutineTasks,
    staleTime: 60_000,
  });

  const employees = useMemo(() => staffToGridEmployees(staff), [staff]);
  const filteredTasks = useMemo(() => {
    const searched = filterTasksBySearch(tasks, search);
    return filterTasksByStatus(searched, statusFilter);
  }, [tasks, search, statusFilter]);
  const overdue = useMemo(() => getOverdueTasks(tasks), [tasks]);

  const title = useMemo(
    () => formatAnchorTitle(viewMode, anchorDate, locale),
    [viewMode, anchorDate, locale],
  );

  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
  }, [queryClient]);

  const shiftAnchor = useCallback(
    (delta: number) => {
      setAnchorDate((d) => addDays(d, viewMode === "day" ? delta : delta * 7));
    },
    [viewMode],
  );

  const isLoading = staffLoading || tasksLoading;
  const hasSearch = search.trim().length > 0;
  const searchHasNoResults = hasSearch && filteredTasks.length === 0 && tasks.length > 0;

  const handleExport = useCallback(() => {
    if (filteredTasks.length === 0) {
      toast.error(t.tasksExportEmpty);
      return;
    }
    try {
      exportTasksWorkbook({
        tasks: filteredTasks,
        routines,
        viewMode,
        anchorDate,
        locale,
        t,
        hotelName: tenant?.hotel?.name,
      });
      toast.success(t.tasksExportSuccess);
    } catch {
      toast.error(t.tasksFailed);
    }
  }, [filteredTasks, routines, viewMode, anchorDate, locale, t, tenant?.hotel?.name]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <TasksToolbar
        t={t}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        title={title}
        search={search}
        onSearchChange={setSearch}
        onPrev={() => shiftAnchor(-1)}
        onNext={() => shiftAnchor(1)}
        onToday={() => setAnchorDate(new Date())}
        onCreate={() => {
          if (staffLoading) return;
          if (employees.length === 0) {
            toast.error(t.tasksNoEmployees);
            return;
          }
          setCreateOpen(true);
        }}
        onExport={handleExport}
        exportDisabled={isLoading || filteredTasks.length === 0}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
        </div>
      ) : employees.length === 0 ? (
        <div className={cn(tasksCard, "py-12 text-center")}>
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">{t.tasksNoEmployees}</p>
        </div>
      ) : searchHasNoResults ? (
        <div className={cn(tasksCard, "py-12 text-center")}>
          <SearchX className="mx-auto mb-3 h-10 w-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-600">{t.tasksNoTasks}</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mx-auto"
            aria-label={t.clearSearch}
            title={t.clearSearch}
          >
            <SearchX className="h-4 w-4" />
          </button>
        </div>
      ) : viewMode === "day" ? (
        <DailyTaskGrid
          day={anchorDate}
          employees={employees}
          tasks={filteredTasks}
          locale={locale}
          t={t}
          onTaskClick={setSelectedTask}
        />
      ) : (
        <WeeklyTaskGrid
          weekAnchor={anchorDate}
          employees={employees}
          tasks={filteredTasks}
          locale={locale}
          t={t}
          onTaskClick={setSelectedTask}
        />
      )}

      {!isLoading && employees.length > 0 && (
        <OverdueTaskList
          tasks={overdue}
          t={t}
          locale={locale}
          onTaskClick={setSelectedTask}
        />
      )}

      {!isLoading && employees.length > 0 && tasks.length > 0 && (
        <TaskPerformanceSection
          tasks={filteredTasks.length > 0 ? filteredTasks : tasks}
          periodFrom={range.from}
          periodTo={range.to}
          locale={locale}
          t={t}
        />
      )}

      <RoutineTasksSection staff={staff} />

      <CreateTaskSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={invalidateTasks}
        staff={staff}
        staffLoading={staffLoading}
        anchorDate={anchorDate}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={invalidateTasks}
        staff={staff}
      />
    </div>
  );
}
