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
  UserCog,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
} from "@/lib/staff";
import { tStaff } from "@/lib/staff-i18n";

const DEPT_MANAGERS_QUERY_KEY = ["staff", "department-managers"];

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
  const colours = DEPARTMENT_COLOURS[dept];
  const displayName = departmentManagerDisplayName(manager);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border bg-white p-4 shadow-sm transition-opacity",
          !manager.isActive && "opacity-60",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
            <p className="truncate text-xs text-zinc-500 mt-0.5">{manager.email}</p>
            <span
              className={cn(
                "inline-flex mt-2 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                colours.bg,
                colours.text,
                colours.border,
              )}
            >
              {DEPARTMENT_LABELS[dept]}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-50 transition-colors touch-manipulation shrink-0"
              >
                <MoreVertical className="w-3.5 h-3.5" />
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
    <section className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-100 text-zinc-700">
            <UserCog className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Department managers</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Email + password accounts for department leads.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="h-9 rounded-xl text-[12px] font-medium shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && (managers ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center">
          <p className="text-sm font-medium text-zinc-600">No department managers yet</p>
          <p className="text-xs text-zinc-400 mt-1">
            Create one manager per department to delegate team and tasks.
          </p>
        </div>
      )}

      {!isLoading && (managers ?? []).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
        <div className="flex items-center gap-2 text-xs text-zinc-400">
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
