/**
 * TaskDetailSheet — view, complete, edit, or cancel a staff task.
 */

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  assigneeDisplayName,
  cancelTask,
  updateTask,
  type StaffTask,
  type TaskStatus,
} from "@/lib/tasks";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/tasks-schedule";
import type { StaffMember } from "@/lib/staff";
import { cn } from "@/lib/utils";
import { TaskAssigneePicker } from "@/components/manager/tasks/TaskAssigneePicker";

const fieldClass =
  "h-9 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-zinc-900";
const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-zinc-400";

function buildSchema(t: StaffTranslations) {
  return z
    .object({
      title: z.string().min(1, t.tasksTitleRequired).max(200),
      description: z.string().max(4000).optional(),
      assigneeUserId: z.string().min(1),
      scheduledStartAt: z.string().min(1),
      scheduledEndAt: z.string().min(1),
    })
    .refine(
      (d) => new Date(d.scheduledEndAt) > new Date(d.scheduledStartAt),
      { message: t.tasksEndAfterStart, path: ["scheduledEndAt"] },
    );
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function statusLabel(t: StaffTranslations, status: TaskStatus): string {
  switch (status) {
    case "pending":
      return t.tasksStatusPending;
    case "in_progress":
      return t.tasksStatusInProgress;
    case "completed":
      return t.tasksStatusCompleted;
    case "cancelled":
      return t.tasksStatusCancelled;
  }
}

export interface TaskDetailSheetProps {
  task: StaffTask | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  staff: StaffMember[];
}

export function TaskDetailSheet({
  task,
  open,
  onClose,
  onUpdated,
  staff,
}: TaskDetailSheetProps) {
  const { t, locale } = useStaffLocale();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      assigneeUserId: "",
      scheduledStartAt: "",
      scheduledEndAt: "",
    },
  });

  useEffect(() => {
    if (!task || !open) return;
    setEditing(false);
    form.reset({
      title: task.title,
      description: task.description ?? "",
      assigneeUserId: String(task.assigneeUserId),
      scheduledStartAt: toDatetimeLocalValue(task.scheduledStartAt),
      scheduledEndAt: toDatetimeLocalValue(task.scheduledEndAt),
    });
  }, [task, open, form]);

  const completeMutation = useMutation({
    mutationFn: () => updateTask(task!.id, { status: "completed" }),
    onSuccess: () => {
      toast.success(t.tasksUpdated);
      onUpdated();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || t.tasksFailed),
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateTask(task!.id, {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        assigneeUserId: parseInt(values.assigneeUserId, 10),
        scheduledStartAt: fromDatetimeLocalValue(values.scheduledStartAt),
        scheduledEndAt: fromDatetimeLocalValue(values.scheduledEndAt),
      }),
    onSuccess: () => {
      toast.success(t.tasksUpdated);
      onUpdated();
      setEditing(false);
    },
    onError: (err: Error) => toast.error(err.message || t.tasksFailed),
  });

  const deleteMutation = useMutation({
    mutationFn: () => cancelTask(task!.id),
    onSuccess: () => {
      toast.success(t.tasksDeleted);
      onUpdated();
      setConfirmDelete(false);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || t.tasksFailed),
  });

  if (!task) return null;

  const start = new Date(task.scheduledStartAt);
  const end = new Date(task.scheduledEndAt);
  const canComplete = task.status !== "completed" && task.status !== "cancelled";

  return (
    <>
      <ManagerCenterSheet
        open={open}
        onClose={onClose}
        ariaLabel={t.tasksDetail}
        closeLabel={t.cancel}
        className="max-w-md"
      >
        <div className="flex flex-col max-h-[min(88dvh,560px)]">
          <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-5 pr-12">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={cn(
                    "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    task.isOverdue
                      ? "bg-red-100 text-red-700"
                      : "bg-zinc-100 text-zinc-600",
                  )}
                >
                  {statusLabel(t, task.status)}
                </p>
                <h2 className="mt-2 text-base font-semibold text-zinc-900">{task.title}</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {assigneeDisplayName(task.assignee)} ·{" "}
                  {start.toLocaleString(locale, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" – "}
                  {end.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

          {editing ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
                className="flex flex-1 flex-col min-h-0"
              >
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>{t.tasksTitle}</FormLabel>
                        <FormControl>
                          <Input className={fieldClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>{t.tasksDescription}</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[72px] rounded-xl border-zinc-100 bg-zinc-50/50 text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assigneeUserId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className={labelClass}>{t.tasksAssignee}</FormLabel>
                        <FormControl>
                          <TaskAssigneePicker
                            staff={staff}
                            value={field.value || undefined}
                            onChange={field.onChange}
                            placeholder={t.tasksSelectAssignee}
                            searchPlaceholder={t.tasksSearchAssignee}
                            emptyLabel={t.tasksNoEmployees}
                            aria-invalid={!!fieldState.error}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="scheduledStartAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>{t.tasksStart}</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" className={fieldClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scheduledEndAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClass}>{t.tasksEnd}</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" className={fieldClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="shrink-0 flex gap-2 border-t border-zinc-100 px-5 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 rounded-2xl"
                    onClick={() => setEditing(false)}
                  >
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending} className="flex-1 h-10 rounded-2xl">
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.tasksSave}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {task.description ? (
                  <p className="text-sm text-zinc-600 whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-sm text-zinc-400 italic">{t.tasksEmptyDescription}</p>
                )}
              </div>
              <div className="shrink-0 flex flex-col gap-2 border-t border-zinc-100 px-5 py-4">
                {canComplete && (
                  <Button
                    type="button"
                    className="h-10 w-full rounded-2xl"
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t.tasksComplete}
                      </>
                    )}
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 rounded-2xl"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {t.tasksEdit}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    {t.tasksDelete}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </ManagerCenterSheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tasksDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.tasksDeleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.tasksDelete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
