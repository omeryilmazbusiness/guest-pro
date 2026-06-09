/**
 * Staff Portal — employee number login + daily task table with completion.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  LogOut,
  TimerOff,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useStaffScope } from "@/hooks/use-staff-scope";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { ROUTES } from "@/lib/app-routes";
import { useTenantNav } from "@/hooks/use-tenant-nav";
import { isStaffRole } from "@/lib/permissions";
import {
  STAFF_PORTAL_QUERY_KEY,
  completeStaffPortalTask,
  formatTaskTimeRange,
  getStaffPortalMe,
  getStaffPortalTasks,
  type StaffPortalTask,
} from "@/lib/staff-portal";
import { Button } from "@/components/ui/button";
import { GuestProLogo } from "@/components/GuestProLogo";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function TaskRow({
  task,
  locale,
  onComplete,
  completing,
}: {
  task: StaffPortalTask;
  locale: string;
  onComplete: (id: number) => void;
  completing: number | null;
}) {
  const isDone = task.status === "completed";

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="py-3 pr-3 align-top">
        <p className="text-[13px] font-medium text-zinc-900">{task.title}</p>
        {task.description && (
          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{task.description}</p>
        )}
      </td>
      <td className="py-3 px-2 align-top whitespace-nowrap">
        <span className="text-[12px] font-mono text-zinc-600">
          {formatTaskTimeRange(task.scheduledStartAt, task.scheduledEndAt, locale)}
        </span>
        {task.isOverdue && !isDone && (
          <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
            <TimerOff className="w-3 h-3" />
            Overdue
          </span>
        )}
      </td>
      <td className="py-3 pl-3 align-top text-right">
        {isDone ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-[11px]"
            disabled={completing === task.id}
            onClick={() => onComplete(task.id)}
          >
            {completing === task.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Completed"
            )}
          </Button>
        )}
      </td>
    </tr>
  );
}

export default function StaffPortalPage() {
  const { user, isAuthenticated, isLoading: authLoading, logoutAuth } = useAuth();
  const staffScope = useStaffScope();
  const { locale } = useStaffLocale();
  const navigate = useTenantNav();
  const queryClient = useQueryClient();
  const [completingId, setCompletingId] = useState<number | null>(null);

  const today = todayDateString();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [...STAFF_PORTAL_QUERY_KEY, "me"],
    queryFn: getStaffPortalMe,
    enabled: isAuthenticated && staffScope?.scope === "staff_personnel",
  });

  const {
    data: tasks = [],
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: [...STAFF_PORTAL_QUERY_KEY, "tasks", today],
    queryFn: () => getStaffPortalTasks(today),
    enabled: isAuthenticated && staffScope?.scope === "staff_personnel",
  });

  const completeMutation = useMutation({
    mutationFn: completeStaffPortalTask,
    onMutate: (id) => setCompletingId(id),
    onSettled: () => setCompletingId(null),
    onSuccess: () => {
      toast.success("Task marked complete");
      queryClient.invalidateQueries({ queryKey: STAFF_PORTAL_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime(),
      ),
    [tasks],
  );

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!isAuthenticated || !isStaffRole(user?.role) || staffScope?.scope !== "staff_personnel") {
    navigate(ROUTES.personelLogin);
    return null;
  }

  const isLoading = profileLoading || tasksLoading;

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <GuestProLogo className="h-7" />
          <button
            type="button"
            onClick={logoutAuth}
            className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-800"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {profile && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-zinc-900">{profile.employee.name}</p>
                <p className="text-[12px] text-zinc-500">
                  #{profile.employee.employeeNumber ?? "—"} · {profile.employee.departmentLabel}
                </p>
                {profile.manager && (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Manager: {profile.manager.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-zinc-400" />
            <h1 className="text-sm font-semibold text-zinc-900">My Tasks Today</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-zinc-300" />
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="py-14 text-center">
              <ClipboardList className="w-10 h-10 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No tasks assigned for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80">
                    <th className="py-2.5 pl-4 pr-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Task
                    </th>
                    <th className="py-2.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Time Window
                    </th>
                    <th className="py-2.5 pl-3 pr-4 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="px-4">
                  {sortedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      locale={locale}
                      completing={completingId}
                      onComplete={(id) => completeMutation.mutate(id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
