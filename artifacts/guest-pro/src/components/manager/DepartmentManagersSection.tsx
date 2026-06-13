/**
 * DepartmentManagersSection — GM-only list and create flow for department managers.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  MoreVertical,
  Plus,
  ShieldCheck,
  ShieldOff,
  Trash2,
  KeyRound,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { CreateDepartmentManagerSheet } from "@/components/manager/CreateDepartmentManagerSheet";
import { ResetPasswordDialog } from "@/components/manager/ResetPasswordDialog";
import {
  listDepartmentManagers,
  updateDepartmentManager,
  deactivateDepartmentManager,
  permanentDeleteDepartmentManager,
  departmentManagerDisplayName,
  DEPARTMENT_LABELS,
  DEPARTMENT_COLOURS,
  type DepartmentManager,
  type DepartmentManagerDepartment,
} from "@/lib/staff";
import { tStaff } from "@/lib/staff-i18n";

const DEPT_MANAGERS_QUERY_KEY = ["staff", "department-managers"];

const LIST_CARD =
  "rounded-xl border border-zinc-200/90 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]";

function DeptManagerIcon({ dept }: { dept: DepartmentManagerDepartment }) {
  const colours = DEPARTMENT_COLOURS[dept];
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
      <UserCog
        className={cn("guest-chat-entry-icon h-8 w-8", colours.text)}
        strokeWidth={1.5}
      />
    </span>
  );
}

function ManagerCard({
  manager,
  onToggleActive,
  onResetPassword,
  onPermanentDelete,
  isPending,
  t,
}: {
  manager: DepartmentManager;
  onToggleActive: (manager: DepartmentManager) => void;
  onResetPassword: (manager: DepartmentManager) => void;
  onPermanentDelete: (manager: DepartmentManager) => void;
  isPending: boolean;
  t: ReturnType<typeof useStaffLocale>["t"];
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dept = manager.staffDepartment;
  const displayName = departmentManagerDisplayName(manager);

  return (
    <>
      <div
        className={cn(
          LIST_CARD,
          "flex items-center gap-3",
          !manager.isActive && "opacity-60",
        )}
      >
        <DeptManagerIcon dept={dept} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-400">{manager.email}</p>
          <p className="mt-0.5 text-[10px] font-medium text-zinc-500">
            {DEPARTMENT_LABELS[dept]}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              className="shrink-0 p-1 text-zinc-400 transition-colors hover:text-zinc-700 touch-manipulation"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions for {displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-zinc-100">
            <DropdownMenuItem
              onClick={() => onResetPassword(manager)}
              className="flex items-center gap-2 rounded-lg cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              {t.resetPassword}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {manager.isActive ? (
              <DropdownMenuItem
                onClick={() => onToggleActive(manager)}
                className="flex items-center gap-2 rounded-lg cursor-pointer text-amber-700 focus:text-amber-800 focus:bg-amber-50"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                {t.deactivateEmployee}
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => onToggleActive(manager)}
                  className="flex items-center gap-2 rounded-lg cursor-pointer text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t.reactivateEmployee}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-2 rounded-lg cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.deleteEmployeePerm}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteDeptManagerTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              {tStaff(t.deleteDeptManagerDesc, { name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteOpen(false);
                onPermanentDelete(manager);
              }}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t.deleteEmployeePerm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DepartmentManagersSection() {
  const queryClient = useQueryClient();
  const { t } = useStaffLocale();
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<DepartmentManager | null>(null);

  const { data: managers, isLoading } = useQuery({
    queryKey: DEPT_MANAGERS_QUERY_KEY,
    queryFn: listDepartmentManagers,
    staleTime: 30_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: DEPT_MANAGERS_QUERY_KEY });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      if (isActive) {
        await deactivateDepartmentManager(id);
      } else {
        await updateDepartmentManager(id, { isActive: true });
      }
    },
    onSuccess: () => {
      toast.success(t.deptManagerUpdated);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update"),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      updateDepartmentManager(id, { password }),
    onSuccess: () => {
      toast.success(t.passwordUpdated);
      setPasswordTarget(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update password"),
  });

  const deleteMutation = useMutation({
    mutationFn: permanentDeleteDepartmentManager,
    onSuccess: () => {
      toast.success(t.deptManagerUpdated);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to delete"),
  });

  const isPending =
    toggleMutation.isPending || passwordMutation.isPending || deleteMutation.isPending;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Department managers
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 transition-opacity hover:opacity-70"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={cn(LIST_CARD, "flex items-center gap-3")}>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-2.5 w-40 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (managers ?? []).length === 0 && (
        <p className="py-4 text-center text-[11px] text-zinc-400">
          No department managers yet
        </p>
      )}

      {!isLoading && (managers ?? []).length > 0 && (
        <div className="space-y-2">
          {(managers ?? []).map((manager) => (
            <ManagerCard
              key={manager.id}
              manager={manager}
              isPending={isPending}
              t={t}
              onToggleActive={(m) =>
                toggleMutation.mutate({ id: m.id, isActive: m.isActive })
              }
              onResetPassword={setPasswordTarget}
              onPermanentDelete={(m) => deleteMutation.mutate(m.id)}
            />
          ))}
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating…
        </div>
      )}

      <CreateDepartmentManagerSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          invalidate();
        }}
      />

      <ResetPasswordDialog
        open={!!passwordTarget}
        onOpenChange={(open) => !open && setPasswordTarget(null)}
        subjectName={
          passwordTarget ? departmentManagerDisplayName(passwordTarget) : ""
        }
        onSubmit={(password) => {
          if (passwordTarget) {
            passwordMutation.mutate({ id: passwordTarget.id, password });
          }
        }}
        isPending={passwordMutation.isPending}
        t={t}
      />
    </section>
  );
}
