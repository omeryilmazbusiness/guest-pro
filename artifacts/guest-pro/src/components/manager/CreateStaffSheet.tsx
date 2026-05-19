/**
 * CreateStaffSheet — centered premium popup to add a staff member.
 */

import { useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  Loader2,
  Mail,
  KeyRound,
  Sparkles,
  ConciergeBell,
  Luggage,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createStaff,
  STAFF_DEPARTMENTS,
  DEPARTMENT_LABELS,
  type StaffDepartment,
} from "@/lib/staff";

const DEPT_ICONS: Record<StaffDepartment, LucideIcon> = {
  HOUSEKEEPING: Sparkles,
  RECEPTION: ConciergeBell,
  BELLMAN: Luggage,
  RESTAURANT: UtensilsCrossed,
};

function buildCreateSchema(t: StaffTranslations) {
  return z.object({
    firstName: z.string().min(1, t.staffFirstNameRequired).max(80),
    lastName: z.string().min(1, t.staffLastNameRequired).max(80),
    email: z.string().email(t.staffEmailInvalid),
    password: z.string().min(8, t.staffPasswordMin),
    staffDepartment: z.enum(STAFF_DEPARTMENTS, {
      errorMap: () => ({ message: t.staffDeptRequired }),
    }),
  });
}

type CreateFormValues = z.infer<ReturnType<typeof buildCreateSchema>>;

const fieldClass =
  "h-9 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm shadow-none focus-visible:bg-white focus-visible:ring-zinc-900";
const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-zinc-400";

export interface CreateStaffSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStaffSheet({ open, onClose, onSuccess }: CreateStaffSheetProps) {
  const { t } = useStaffLocale();
  const schema = useMemo(() => buildCreateSchema(t), [t]);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      staffDepartment: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      staffDepartment: undefined,
    });
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      toast.success(t.staffMemberAdded);
      form.reset();
      onSuccess();
    },
    onError: (err: Error) => toast.error(err.message ?? t.failedCreateStaff),
  });

  function handleClose() {
    if (mutation.isPending) return;
    form.reset();
    onClose();
  }

  return (
    <ManagerCenterSheet
      open={open}
      onClose={handleClose}
      ariaLabel={t.addStaffMember}
      closeLabel={t.cancel}
      className="max-w-[min(100%,22rem)]"
    >
      <div className="flex max-h-[min(88dvh,34rem)] flex-col">
        {/* Header */}
        <div className="border-b border-zinc-100 px-5 pb-4 pt-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white">
              <UserPlus className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-[17px] font-semibold tracking-tight text-zinc-900">
                {t.addStaffMember}
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
                {t.addStaffSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-5 py-4">
              <div className="grid grid-cols-2 gap-2.5">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>{t.staffFirstName}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sarah"
                          autoComplete="given-name"
                          className={fieldClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClass}>{t.staffLastName}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Yılmaz"
                          autoComplete="family-name"
                          className={fieldClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>{t.staffEmail}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                        <Input
                          type="email"
                          placeholder="name@hotel.com"
                          autoComplete="email"
                          className={cn(fieldClass, "pl-9")}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>{t.staffTempPassword}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className={cn(fieldClass, "pl-9")}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="staffDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>{t.staffDepartment}</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-1.5">
                        {STAFF_DEPARTMENTS.map((dept) => {
                          const Icon = DEPT_ICONS[dept];
                          const selected = field.value === dept;
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => field.onChange(dept)}
                              className={cn(
                                "flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left transition-all touch-manipulation",
                                selected
                                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                                  : "border-zinc-100 bg-zinc-50/80 text-zinc-700 hover:border-zinc-200 hover:bg-white",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  selected ? "text-white" : "text-zinc-400",
                                )}
                                strokeWidth={1.75}
                              />
                              <span className="text-[11px] font-medium leading-tight">
                                {DEPARTMENT_LABELS[dept]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-zinc-100 bg-zinc-50/80 px-5 py-3.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
                className="h-10 flex-1 rounded-xl border-zinc-200 bg-white text-sm font-medium"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-10 flex-1 rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t.addStaffMemberBtn
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ManagerCenterSheet>
  );
}
