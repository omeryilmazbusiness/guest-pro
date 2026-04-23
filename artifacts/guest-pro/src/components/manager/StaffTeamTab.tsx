/**
 * StaffTeamTab — Employee management screen (manager-only).
 *
 * Architecture:
 *   - Domain types + API calls → lib/staff.ts
 *   - Presence model → lib/staff.ts (resolveEmployeePresence)
 *   - Filter / sort logic → pure functions in this file
 *   - CreateStaffModal / EditStaffModal → self-contained sub-components
 *   - Overview bar removed — stats now live in ManagerOverviewCards (dashboard level)
 *
 * UX principles:
 *   - Search bar with filter icon → dropdown (no always-visible chips)
 *   - Presence badges use "In hotel / Out of hotel / Unknown / Inactive" language
 *   - Cards scannable in < 1 second: name → dept → presence
 *   - Mobile-first single column → 2-column on sm+
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Loader2,
  Users,
  Pencil,
  ShieldOff,
  ShieldCheck,
  MoreVertical,
  Search,
  X,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  listStaff,
  createStaff,
  updateStaff,
  deactivateStaff,
  staffDisplayName,
  resolveEmployeePresence,
  STAFF_DEPARTMENTS,
  DEPARTMENT_LABELS,
  DEPARTMENT_COLOURS,
  EMPLOYEE_PRESENCE_LABEL,
  type StaffMember,
  type StaffDepartment,
  type StaffInfo,
} from "@/lib/staff";

// ── Constants ─────────────────────────────────────────────────────────────────

const STAFF_QUERY_KEY = ["staff", "list"];

type DeptFilter = StaffDepartment | "ALL";

// ── Pure filter / sort helpers ────────────────────────────────────────────────

function filterEmployees(
  staff: StaffMember[],
  dept: DeptFilter,
  search: string,
): StaffMember[] {
  let result = staff;
  if (dept !== "ALL") {
    result = result.filter((m) => m.staffDepartment === dept);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (m) =>
        staffDisplayName(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
    );
  }
  return result;
}

function buildStaffInfo(staff: StaffMember[]): StaffInfo {
  const byDept: Partial<Record<StaffDepartment, number>> = {};
  for (const m of staff) {
    if (m.isActive && m.staffDepartment) {
      byDept[m.staffDepartment] = (byDept[m.staffDepartment] ?? 0) + 1;
    }
  }
  return {
    total: staff.length,
    active: staff.filter((m) => m.isActive).length,
    byDept,
  };
}

// ── Validation schemas ────────────────────────────────────────────────────────

const createSchema = z.object({
  firstName:       z.string().min(1, "First name is required").max(80),
  lastName:        z.string().min(1, "Last name is required").max(80),
  email:           z.string().email("Enter a valid email address"),
  password:        z.string().min(8, "Password must be at least 8 characters"),
  staffDepartment: z.enum(STAFF_DEPARTMENTS, {
    errorMap: () => ({ message: "Select a department" }),
  }),
});

const editSchema = z.object({
  firstName:       z.string().min(1, "First name is required").max(80),
  lastName:        z.string().min(1, "Last name is required").max(80),
  staffDepartment: z.enum(STAFF_DEPARTMENTS, {
    errorMap: () => ({ message: "Select a department" }),
  }),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues   = z.infer<typeof editSchema>;

// ── Sub-components ────────────────────────────────────────────────────────────

/** Coloured pill badge for a staff department. */
function DepartmentBadge({ dept }: { dept: StaffDepartment | null }) {
  if (!dept) return null;
  const c = DEPARTMENT_COLOURS[dept];
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border leading-none shrink-0",
        c.bg, c.text, c.border,
      )}
    >
      {DEPARTMENT_LABELS[dept]}
    </span>
  );
}

/** Initials avatar — department-coloured ring when dept is set. */
function EmployeeAvatar({ member }: { member: StaffMember }) {
  const initials =
    [(member.firstName ?? "")[0], (member.lastName ?? "")[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  const dept = member.staffDepartment;
  const ring = dept ? DEPARTMENT_COLOURS[dept].border.replace("border-", "ring-") : "ring-zinc-100";

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center",
        "text-[13px] font-semibold text-zinc-500 shrink-0 ring-2",
        ring,
      )}
    >
      {initials}
    </div>
  );
}

/**
 * Presence badge — uses the shared EmployeePresence vocabulary.
 * Active staff show "Unknown" until real-time tracking is built.
 */
function PresenceBadge({ member }: { member: StaffMember }) {
  const presence = resolveEmployeePresence(member);
  const styles: Record<string, { dot: string; label: string }> = {
    IN_HOTEL:     { dot: "bg-emerald-400", label: "text-emerald-600" },
    OUT_OF_HOTEL: { dot: "bg-rose-400",    label: "text-rose-500" },
    UNKNOWN:      { dot: "bg-amber-300",   label: "text-amber-600" },
    INACTIVE:     { dot: "bg-zinc-300",    label: "text-zinc-400" },
  };
  const s = styles[presence] ?? styles.UNKNOWN;
  return (
    <span className="flex items-center gap-1 leading-none shrink-0">
      <span className={cn("w-1.5 h-1.5 rounded-full inline-block shrink-0", s.dot)} />
      <span className={cn("text-[10px] font-medium", s.label)}>
        {EMPLOYEE_PRESENCE_LABEL[presence]}
      </span>
    </span>
  );
}

// ── Search bar with embedded filter icon ──────────────────────────────────────

const DEPT_OPTIONS: { key: DeptFilter; label: string }[] = [
  { key: "ALL",          label: "All departments" },
  ...STAFF_DEPARTMENTS.map((d) => ({ key: d as DeptFilter, label: DEPARTMENT_LABELS[d] })),
];

function EmployeeSearchBar({
  search,
  onSearchChange,
  deptFilter,
  onDeptChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: DeptFilter;
  onDeptChange: (v: DeptFilter) => void;
}) {
  const isFiltered = deptFilter !== "ALL";

  return (
    <div className="relative flex items-center">
      {/* Search icon */}
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />

      {/* Input */}
      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 pr-16 h-10 rounded-xl bg-white border-zinc-100 text-sm shadow-sm focus-visible:ring-zinc-900"
      />

      {/* Right-side controls */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        {/* Clear search */}
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Filter icon → dept dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "relative p-2 rounded-lg transition-all touch-manipulation",
                isFiltered
                  ? "text-zinc-900 bg-zinc-100"
                  : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50",
              )}
              aria-label="Filter by department"
              title="Filter by department"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {/* Active filter dot */}
              {isFiltered && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-900" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 rounded-xl shadow-xl border-zinc-100"
          >
            {DEPT_OPTIONS.map(({ key, label }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onDeptChange(key)}
                className="flex items-center justify-between gap-2 rounded-lg cursor-pointer"
              >
                <span className="text-sm">{label}</span>
                {deptFilter === key && (
                  <Check className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Employee card ─────────────────────────────────────────────────────────────

function EmployeeCard({
  member,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  member: StaffMember;
  onEdit:       (m: StaffMember) => void;
  onDeactivate: (m: StaffMember) => void;
  onReactivate: (m: StaffMember) => void;
}) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  return (
    <div
      className={cn(
        "bg-white border rounded-2xl p-3.5 flex items-start gap-3 transition-opacity",
        member.isActive
          ? "border-zinc-100 shadow-sm shadow-zinc-100/60"
          : "border-zinc-100 opacity-55",
      )}
    >
      {/* Avatar */}
      <EmployeeAvatar member={member} />

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Name row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900 truncate leading-snug">
            {staffDisplayName(member)}
          </p>
          <PresenceBadge member={member} />
        </div>

        {/* Email */}
        <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>

        {/* Department + actions row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <DepartmentBadge dept={member.staffDepartment} />

          {/* Actions */}
          {confirmDeactivate ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => { setConfirmDeactivate(false); onDeactivate(member); }}
                className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-50 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-50 transition-colors touch-manipulation shrink-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                  <span className="sr-only">Actions for {staffDisplayName(member)}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-zinc-100">
                <DropdownMenuItem
                  onClick={() => onEdit(member)}
                  className="flex items-center gap-2 rounded-lg cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {member.isActive ? (
                  <DropdownMenuItem
                    onClick={() => setConfirmDeactivate(true)}
                    className="flex items-center gap-2 rounded-lg cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => onReactivate(member)}
                    className="flex items-center gap-2 rounded-lg cursor-pointer text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function EmployeeCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-3.5 flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32 rounded" />
        <Skeleton className="h-2.5 w-48 rounded" />
        <Skeleton className="h-4 w-20 rounded-full mt-1" />
      </div>
    </div>
  );
}

// ── Create staff modal ────────────────────────────────────────────────────────

function CreateStaffModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", staffDepartment: undefined },
  });

  const mutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => { toast.success("Staff member added"); form.reset(); onSuccess(); },
    onError: (err: Error) => toast.error(err.message ?? "Failed to create staff member"),
  });

  function handleClose() {
    if (mutation.isPending) return;
    form.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input placeholder="Sarah" autoComplete="off" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input placeholder="Yılmaz" autoComplete="off" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="sarah@grandhotel.com" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Temporary Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min. 8 characters" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="staffDepartment" render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAFF_DEPARTMENTS.map((dept) => {
                      const c = DEPARTMENT_COLOURS[dept];
                      return (
                        <SelectItem key={dept} value={dept}>
                          <span className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full inline-block", c.bg.replace("-50", "-400"))} />
                            {DEPARTMENT_LABELS[dept]}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit staff modal ──────────────────────────────────────────────────────────

function EditStaffModal({
  member,
  onClose,
  onSuccess,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: member
      ? {
          firstName:       member.firstName ?? "",
          lastName:        member.lastName ?? "",
          staffDepartment: (member.staffDepartment ?? "RECEPTION") as StaffDepartment,
        }
      : { firstName: "", lastName: "", staffDepartment: "RECEPTION" },
  });

  const mutation = useMutation({
    mutationFn: (values: EditFormValues) => updateStaff(member!.id, values),
    onSuccess: () => { toast.success("Details updated"); onSuccess(); },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update"),
  });

  if (!member) return null;

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="staffDepartment" render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAFF_DEPARTMENTS.map((dept) => {
                      const c = DEPARTMENT_COLOURS[dept];
                      return (
                        <SelectItem key={dept} value={dept}>
                          <span className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full inline-block", c.bg.replace("-50", "-400"))} />
                            {DEPARTMENT_LABELS[dept]}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Email — read-only */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-700">Email</p>
              <p className="text-sm text-zinc-500 font-mono bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 truncate">
                {member.email}
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main tab export ───────────────────────────────────────────────────────────

interface StaffTeamTabProps {
  /**
   * Called whenever the staff list loads or changes.
   * Allows the parent dashboard to populate the Employee overview card.
   */
  staffCount?: (info: StaffInfo) => void;
  /**
   * Controlled "create modal open" state — when provided, the parent
   * (e.g. the overview card's + button) can open the modal externally.
   */
  externalCreateOpen?: boolean;
  onExternalCreateOpenChange?: (open: boolean) => void;
}

export function StaffTeamTab({
  staffCount,
  externalCreateOpen,
  onExternalCreateOpenChange,
}: StaffTeamTabProps) {
  const queryClient = useQueryClient();

  // ── Remote data
  const { data: staff, isLoading } = useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: listStaff,
    staleTime: 30_000,
  });

  // Bubble full StaffInfo to parent overview cards — side-effect, not select.
  useEffect(() => {
    if (staff) staffCount?.(buildStaffInfo(staff));
  }, [staff, staffCount]);

  // ── Mutations
  const deactivateMutation = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => { toast.success("Staff member deactivated"); queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY }); },
    onError:   (err: Error) => toast.error(err.message ?? "Failed to deactivate"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => updateStaff(id, { isActive: true }),
    onSuccess: () => { toast.success("Staff member reactivated"); queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY }); },
    onError:   (err: Error) => toast.error(err.message ?? "Failed to reactivate"),
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY }),
    [queryClient],
  );

  // ── Create modal — merged internal + external controlled state
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const isCreateOpen = externalCreateOpen ?? internalCreateOpen;
  const setCreateOpen = useCallback((v: boolean) => {
    setInternalCreateOpen(v);
    onExternalCreateOpenChange?.(v);
  }, [onExternalCreateOpenChange]);

  // ── Other local UI state
  const [editTarget, setEditTarget]  = useState<StaffMember | null>(null);
  const [deptFilter, setDeptFilter]  = useState<DeptFilter>("ALL");
  const [search, setSearch]          = useState("");

  // ── Derived data
  const visibleStaff = useMemo(
    () => filterEmployees(staff ?? [], deptFilter, search),
    [staff, deptFilter, search],
  );

  const activeVisible   = visibleStaff.filter((m) => m.isActive);
  const inactiveVisible = visibleStaff.filter((m) => !m.isActive);

  const hasFilter = deptFilter !== "ALL" || search.trim().length > 0;

  // ── Render
  return (
    <div className="space-y-4 pb-10">

      {/* ── Search bar + filter icon ──────────────────────────────── */}
      {!isLoading && (staff ?? []).length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <EmployeeSearchBar
              search={search}
              onSearchChange={setSearch}
              deptFilter={deptFilter}
              onDeptChange={setDeptFilter}
            />
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-10 px-3.5 rounded-xl text-[13px] font-medium shadow-sm shadow-zinc-900/10 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      )}

      {/* ── Loading skeletons ─────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <EmployeeCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Empty state (no staff at all) ─────────────────────────── */}
      {!isLoading && (staff ?? []).length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-700">No employees yet</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add your first team member to get started.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-1 rounded-xl"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Staff Member
          </Button>
        </div>
      )}

      {/* ── No search/filter results ──────────────────────────────── */}
      {!isLoading && (staff ?? []).length > 0 && visibleStaff.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-zinc-600">No employees match</p>
          <p className="text-xs text-zinc-400 mt-1">
            Try a different department or clear the search.
          </p>
          <button
            onClick={() => { setSearch(""); setDeptFilter("ALL"); }}
            className="mt-3 text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Active employees ──────────────────────────────────────── */}
      {activeVisible.length > 0 && (
        <div className="space-y-2">
          {hasFilter && (
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-0.5">
              {activeVisible.length} employee{activeVisible.length !== 1 ? "s" : ""}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeVisible.map((member) => (
              <EmployeeCard
                key={member.id}
                member={member}
                onEdit={setEditTarget}
                onDeactivate={(m) => deactivateMutation.mutate(m.id)}
                onReactivate={(m) => reactivateMutation.mutate(m.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Inactive employees ────────────────────────────────────── */}
      {inactiveVisible.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-0.5">
            Inactive ({inactiveVisible.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {inactiveVisible.map((member) => (
              <EmployeeCard
                key={member.id}
                member={member}
                onEdit={setEditTarget}
                onDeactivate={(m) => deactivateMutation.mutate(m.id)}
                onReactivate={(m) => reactivateMutation.mutate(m.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      <CreateStaffModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); invalidate(); }}
      />
      <EditStaffModal
        member={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => { setEditTarget(null); invalidate(); }}
      />
    </div>
  );
}
