/**
 * RoutineTasksSection — recurring templates with expand popup.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import {
  ROUTINE_TASKS_QUERY_KEY,
  createRoutineTask,
  deleteRoutineTask,
  listRoutineTasks,
  type RoutineTask,
} from "@/lib/routine-tasks";
import type { StaffMember } from "@/lib/staff";
import { staffDisplayName } from "@/lib/staff";
import { tasksCard, tasksIconBtnPrimary } from "@/lib/tasks-ui";
import { cn } from "@/lib/utils";
import { TasksTableSection } from "@/components/manager/tasks/TasksTableSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";

interface Props {
  staff: StaffMember[];
}

function CreateRoutineSheet({
  open,
  onClose,
  staff,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("10:00");
  const [assigneeId, setAssigneeId] = useState<number | "">("");

  const mutation = useMutation({
    mutationFn: createRoutineTask,
    onSuccess: () => {
      toast.success("Routine task created");
      onSuccess();
      onClose();
      setTitle("");
      setAssigneeId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <ManagerCenterSheet open={open} onClose={onClose} ariaLabel="New Routine Task" closeLabel="Close">
      <div className="px-5 pt-4 pb-2 border-b border-zinc-100">
        <h3 className="text-[15px] font-semibold text-zinc-900">New Routine Task</h3>
      </div>
      <div className="space-y-4 px-5 py-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Task Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Daily room inspection"
            className="mt-1 h-10 rounded-xl"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Assign To
          </label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm"
          >
            <option value="">Select employee</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {staffDisplayName(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Start
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              End
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 h-10 rounded-xl"
            />
          </div>
        </div>
        <Button
          className="w-full h-11 rounded-xl"
          disabled={!title.trim() || !assigneeId || mutation.isPending}
          onClick={() =>
            mutation.mutate({
              title: title.trim(),
              assigneeUserId: Number(assigneeId),
              startTime,
              endTime,
            })
          }
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Routine"}
        </Button>
      </div>
    </ManagerCenterSheet>
  );
}

function RoutineRow({
  task,
  onDelete,
  flat = false,
}: {
  task: RoutineTask;
  onDelete: (id: number) => void;
  flat?: boolean;
}) {
  return (
    <div
      className={cn(
        flat ? "rounded-xl border border-amber-100/80 bg-amber-50/40" : tasksCard,
        "flex items-center gap-3 px-3 py-3",
      )}
    >
      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 ring-1 ring-amber-100">
        <Repeat className="w-4 h-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate">{task.title}</p>
        <p className="text-[11px] text-slate-500">
          {task.assignee.name} · {task.startTime}–{task.endTime}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50"
        aria-label="Delete routine"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function RoutineTasksSection({ staff }: Props) {
  const { t } = useStaffLocale();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ROUTINE_TASKS_QUERY_KEY,
    queryFn: listRoutineTasks,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoutineTask,
    onSuccess: () => {
      toast.success("Routine task removed");
      queryClient.invalidateQueries({ queryKey: ROUTINE_TASKS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDelete = (id: number) => {
    if (confirm("Delete this routine task? It will stop auto-assigning.")) {
      deleteMutation.mutate(id);
    }
  };

  const addButton = (
    <button
      type="button"
      className={tasksIconBtnPrimary}
      onClick={() => setCreateOpen(true)}
      disabled={staff.length === 0}
      aria-label={t.tasksNewShort}
      title={t.tasksNewShort}
    >
      <Plus className="w-4 h-4" />
    </button>
  );

  return (
    <>
      <TasksTableSection
        icon={Repeat}
        title={t.tasksRoutineShort}
        accent="amber"
        t={t}
        showScrollHint={false}
        headerActions={addButton}
        renderContent={({ expanded }) => {
          if (isLoading) {
            return (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            );
          }
          if (routines.length === 0) {
            return (
              <div className="rounded-xl border border-dashed border-amber-200/60 bg-amber-50/30 py-8 text-center">
                <Repeat className="w-8 h-8 text-amber-200 mx-auto" />
              </div>
            );
          }
          return (
            <div className={expanded ? "space-y-2.5" : "space-y-2"}>
              {routines.map((task) => (
                <RoutineRow key={task.id} task={task} onDelete={handleDelete} flat={expanded} />
              ))}
            </div>
          );
        }}
      />

      <CreateRoutineSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        staff={staff}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ROUTINE_TASKS_QUERY_KEY })}
      />
    </>
  );
}
