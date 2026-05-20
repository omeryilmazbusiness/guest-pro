/**
 * CreateTaskSheet — centered premium popup to schedule a new staff task.
 */

import { useCallback, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Loader2 } from "lucide-react";
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
import { createTask, type StaffTask } from "@/lib/tasks";
import {
  defaultCreateRange,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/tasks-schedule";
import type { StaffMember } from "@/lib/staff";
import { TaskAssigneePicker } from "@/components/manager/tasks/TaskAssigneePicker";

const fieldClass =
  "h-9 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-zinc-900";
const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-zinc-400";

function buildSchema(t: StaffTranslations) {
  return z
    .object({
      title: z.string().min(1, t.tasksTitleRequired).max(200),
      description: z.string().max(4000).optional(),
      assigneeUserId: z.string().min(1, t.tasksAssigneeRequired),
      scheduledStartAt: z.string().min(1),
      scheduledEndAt: z.string().min(1),
    })
    .refine(
      (d) => new Date(d.scheduledEndAt) > new Date(d.scheduledStartAt),
      { message: t.tasksEndAfterStart, path: ["scheduledEndAt"] },
    );
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function buildDefaultValues(
  anchorDate: Date,
  activeStaff: StaffMember[],
): FormValues {
  const { start, end } = defaultCreateRange(anchorDate);
  return {
    title: "",
    description: "",
    assigneeUserId: activeStaff[0] ? String(activeStaff[0].id) : "",
    scheduledStartAt: toDatetimeLocalValue(start),
    scheduledEndAt: toDatetimeLocalValue(end),
  };
}

export interface CreateTaskSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (task: StaffTask) => void;
  staff: StaffMember[];
  staffLoading?: boolean;
  anchorDate: Date;
}

export function CreateTaskSheet({
  open,
  onClose,
  onSuccess,
  staff,
  staffLoading = false,
  anchorDate,
}: CreateTaskSheetProps) {
  const { t } = useStaffLocale();
  const schema = useMemo(() => buildSchema(t), [t]);

  const activeStaff = useMemo(() => staff.filter((s) => s.isActive), [staff]);
  const canAssign = activeStaff.length > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(anchorDate, activeStaff),
  });

  const resetForm = useCallback(() => {
    form.reset(buildDefaultValues(anchorDate, activeStaff));
  }, [form, anchorDate, activeStaff]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, resetForm]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createTask({
        title: values.title.trim(),
        description: values.description?.trim() || null,
        assigneeUserId: parseInt(values.assigneeUserId, 10),
        scheduledStartAt: fromDatetimeLocalValue(values.scheduledStartAt),
        scheduledEndAt: fromDatetimeLocalValue(values.scheduledEndAt),
      }),
    onSuccess: (task) => {
      toast.success(t.tasksCreated);
      onSuccess(task);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || t.tasksFailed),
  });

  return (
    <ManagerCenterSheet
      open={open}
      onClose={onClose}
      ariaLabel={t.tasksNewTask}
      closeLabel={t.cancel}
      className="max-w-md"
    >
      <div className="flex flex-col max-h-[min(88dvh,560px)]">
        <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-5 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-900 text-white">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{t.tasksNewTask}</h2>
              <p className="text-xs text-zinc-500">{t.tasksCreateHint}</p>
            </div>
          </div>
        </div>

        {staffLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-300" />
          </div>
        ) : !canAssign ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-zinc-700">{t.tasksNoEmployees}</p>
            <Button type="button" variant="outline" className="mt-4 rounded-2xl" onClick={onClose}>
              {t.cancel}
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
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
                          className="min-h-[72px] rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus-visible:bg-white focus-visible:ring-zinc-900"
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
                          isLoading={staffLoading}
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

              <div className="shrink-0 border-t border-zinc-100 px-5 py-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full h-10 rounded-2xl"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.tasksCreate
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </ManagerCenterSheet>
  );
}
