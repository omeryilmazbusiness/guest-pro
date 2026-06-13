/**
 * EmployeeDetailSheet — centered employee detail popup (manager dashboard).
 */

import { useState } from "react";
import {
  Pencil,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Mail,
  KeyRound,
  Sparkles,
  ConciergeBell,
  Luggage,
  UtensilsCrossed,
  ChefHat,
  Shield,
  Wrench,
  Megaphone,
  Dumbbell,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import {
  staffDisplayName,
  resolveEmployeePresence,
  staffLoginLabel,
  isEmailLoginPersonnelDepartment,
  DEPARTMENT_LABELS,
  DEPARTMENT_COLOURS,
  EMPLOYEE_PRESENCE_LABEL,
  type StaffMember,
  type StaffDepartment,
} from "@/lib/staff";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { tStaff } from "@/lib/staff-i18n";
import { cn } from "@/lib/utils";

const DEPT_ICONS: Record<StaffDepartment, React.FC<{ className?: string }>> = {
  HOUSEKEEPING: Sparkles,
  RECEPTION: ConciergeBell,
  BELLMAN: Luggage,
  RESTAURANT: UtensilsCrossed,
  KITCHEN: ChefHat,
  FINANCIAL_ACCOUNTING: Calculator,
  SECURITY: Shield,
  MAINTENANCE: Wrench,
  MARKETING: Megaphone,
  SPA_GYM: Dumbbell,
};

export interface EmployeeDetailSheetProps {
  member: StaffMember | null;
  open: boolean;
  onClose: () => void;
  onEdit: (m: StaffMember) => void;
  onDeactivate: (m: StaffMember) => void;
  onReactivate: (m: StaffMember) => void;
  onPermanentDelete: (m: StaffMember) => void;
  onResetPassword?: (m: StaffMember) => void;
  isDeletePending?: boolean;
  t: StaffTranslations;
}

export function EmployeeDetailSheet({
  member,
  open,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
  onPermanentDelete,
  onResetPassword,
  isDeletePending = false,
  t,
}: EmployeeDetailSheetProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (!member) return null;

  const displayName = staffDisplayName(member);
  const presence = resolveEmployeePresence(member);
  const dept = member.staffDepartment;
  const deptColours = dept ? DEPARTMENT_COLOURS[dept] : null;
  const DeptIcon = dept ? DEPT_ICONS[dept] : null;
  const initials =
    [(member.firstName ?? "")[0], (member.lastName ?? "")[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  const presenceStyles: Record<string, { dot: string; text: string }> = {
    IN_HOTEL: { dot: "bg-emerald-400", text: "text-emerald-600" },
    OUT_OF_HOTEL: { dot: "bg-zinc-400", text: "text-zinc-500" },
    UNKNOWN: { dot: "bg-zinc-300", text: "text-zinc-500" },
    INACTIVE: { dot: "bg-zinc-300", text: "text-zinc-400" },
  };
  const ps = presenceStyles[presence] ?? presenceStyles.UNKNOWN;

  return (
    <ManagerCenterSheet
      open={open}
      onClose={onClose}
      ariaLabel={t.employeeDetails}
      closeLabel={t.cancel}
    >
      <div className="flex flex-col overflow-y-auto overscroll-contain px-5 pb-5 pt-10">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-lg font-semibold text-zinc-600 ring-2",
              deptColours?.border.replace("border-", "ring-") ?? "ring-zinc-100",
            )}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="truncate text-lg font-semibold text-zinc-900">
              {staffDisplayName(member)}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", ps.dot)} />
                <span className={cn("text-[11px] font-medium", ps.text)}>
                  {EMPLOYEE_PRESENCE_LABEL[presence]}
                </span>
              </span>
              {!member.isActive && (
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500">
                  {t.overviewInactive}
                </span>
              )}
            </div>
            {dept && deptColours && DeptIcon && (
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  deptColours.bg,
                  deptColours.text,
                  deptColours.border,
                )}
              >
                <DeptIcon className="h-2.5 w-2.5" />
                {DEPARTMENT_LABELS[dept]}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
          {member.employeeNumber && !isEmailLoginPersonnelDepartment(member.staffDepartment) ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Employee No.
              </p>
              <p className="mt-1 font-mono text-sm text-zinc-700">#{member.employeeNumber}</p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <Mail className="h-3 w-3" />
                Email
              </p>
              <p className="mt-1 truncate font-mono text-sm text-zinc-700">{staffLoginLabel(member)}</p>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="outline"
            className="h-11 w-full justify-start gap-2.5 rounded-xl border-zinc-200"
            onClick={() => {
              onClose();
              onEdit(member);
            }}
          >
            <Pencil className="h-4 w-4 text-zinc-500" />
            {t.editEmployee}
          </Button>

          {onResetPassword && (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-zinc-200"
              onClick={() => {
                onClose();
                onResetPassword(member);
              }}
            >
              <KeyRound className="h-4 w-4 text-zinc-500" />
              {t.resetPassword}
            </Button>
          )}

          {member.isActive ? (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => {
                onClose();
                onDeactivate(member);
              }}
            >
              <ShieldOff className="h-4 w-4" />
              {t.deactivateEmployee}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-2.5 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                onClose();
                onReactivate(member);
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              {t.reactivateEmployee}
            </Button>
          )}

          <Button
            variant="outline"
            className="h-11 w-full justify-start gap-2.5 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t.deleteEmployeePerm}
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteEmployeeTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500">
              {tStaff(t.deleteEmployeeDesc, { name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletePending}
              onPointerDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteOpen(false);
                onClose();
                onPermanentDelete(member);
              }}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t.deleteEmployeePerm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ManagerCenterSheet>
  );
}
