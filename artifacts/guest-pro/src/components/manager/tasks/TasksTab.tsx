/**
 * TasksTab — manager task scheduling (daily / weekly grids + overdue list).
 */

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { listStaff } from "@/lib/staff";
import {
  TASKS_QUERY_KEY,
  listTasks,
  type StaffTask,
} from "@/lib/tasks";
import {
  addDays,
  filterTasksBySearch,
  formatAnchorTitle,
  getDayRangeISO,
  getOverdueTasks,
  getWeekRangeISO,
  staffToGridEmployees,
  type TasksViewMode,
} from "@/lib/tasks-schedule";
import { TasksToolbar } from "@/components/manager/tasks/TasksToolbar";
import { DailyTaskGrid } from "@/components/manager/tasks/DailyTaskGrid";
import { WeeklyTaskGrid } from "@/components/manager/tasks/WeeklyTaskGrid";
import { OverdueTaskList } from "@/components/manager/tasks/OverdueTaskList";
import { CreateTaskSheet } from "@/components/manager/tasks/CreateTaskSheet";
import { TaskDetailSheet } from "@/components/manager/tasks/TaskDetailSheet";

export function TasksTab() {
  const { t, locale } = useStaffLocale();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<TasksViewMode>("day");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [search, setSearch] = useState("");
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

  const employees = useMemo(() => staffToGridEmployees(staff), [staff]);
  const filteredTasks = useMemo(
    () => filterTasksBySearch(tasks, search),
    [tasks, search],
  );
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
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
        </div>
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-white py-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
          <p className="text-sm font-medium text-zinc-700">{t.tasksNoEmployees}</p>
        </div>
      ) : filteredTasks.length === 0 && !search ? (
        <div className="rounded-2xl border border-zinc-100 bg-white py-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
          <p className="text-sm font-medium text-zinc-700">{t.tasksNoTasks}</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 text-sm font-medium text-zinc-900 underline underline-offset-2"
          >
            {t.tasksNewTask}
          </button>
        </div>
      ) : viewMode === "day" ? (
        <DailyTaskGrid
          day={anchorDate}
          employees={employees}
          tasks={filteredTasks}
          locale={locale}
          onTaskClick={setSelectedTask}
        />
      ) : (
        <WeeklyTaskGrid
          weekAnchor={anchorDate}
          employees={employees}
          tasks={filteredTasks}
          locale={locale}
          onTaskClick={setSelectedTask}
        />
      )}

      <OverdueTaskList
        tasks={overdue}
        t={t}
        locale={locale}
        onTaskClick={setSelectedTask}
      />

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
