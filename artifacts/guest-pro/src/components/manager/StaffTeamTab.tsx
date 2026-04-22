/**
 * StaffTeamTab
 *
 * Manager-only team management section.
 *
 * Features:
 *   - List all personnel with department badge and active/inactive status
 *   - Create new staff member (name, email, password, department)
 *   - Edit name and department
 *   - Deactivate (soft-delete) with inline confirmation
 *
 * Architecture:
 *   - All domain types and API calls live in lib/staff.ts
 *   - This file contains only UI composition and local state
 *   - Permissions are enforced on the server; the UI simply hides controls
 *     that the current user lacks access to
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Loader2,
  UserCircle,
  Pencil,
  ShieldOff,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  STAFF_DEPARTMENTS,
  DEPARTMENT_LABELS,
  DEPARTMENT_COLOURS,
  type StaffMember,
  type StaffDepartment,
} from "@/lib/staff";

// ── Query key ─────────────────────────────────────────────────────────────────

const STAFF_QUERY_KEY = ["staff", "list"];

// ── Validation schemas ────────────────────────────────────────────────────────

const createSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName:  z.string().min(1, "Last name is required").max(80),
  email:     z.string().email("Enter a valid email address"),
  password:  z.string().min(8, "Password must be at least 8 characters"),
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

// ── Department badge ──────────────────────────────────────────────────────────

function DepartmentBadge({ dept }: { dept: StaffDepartment | null }) {
  if (!dept) return null;
  const c = DEPARTMENT_COLOURS[dept];
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border",
        c.bg, c.text, c.border,
      )}
    >
      {DEPARTMENT_LABELS[dept]}
    </span>
  );
}

// ── Initials avatar ───────────────────────────────────────────────────────────

function InitialsAvatar({
  member,
  className,
}: {
  member: StaffMember;
  className?: string;
}) {
  const initials =
    [(member.firstName ?? "")[0], (member.lastName ?? "")[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-[13px] font-semibold text-zinc-500 shrink-0",
        className,
      )}
    >
      {initials}
    </div>
  );
}

// ── Staff card ────────────────────────────────────────────────────────────────

function StaffCard({
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
        "bg-white border rounded-2xl p-4 flex flex-col gap-3 transition-opacity",
        member.isActive ? "border-zinc-100 shadow-sm" : "border-zinc-100 opacity-60",
      )}
    >
      {/* Top row: avatar + name + badge */}
      <div className="flex items-start gap-3">
        <InitialsAvatar member={member} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">
            {staffDisplayName(member)}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <DepartmentBadge dept={member.staffDepartment} />
            {!member.isActive && (
              <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={() => onEdit(member)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 transition-colors"
        >
          <Pencil className="w-3 h-3" aria-hidden="true" />
          Edit
        </button>

        {member.isActive ? (
          confirmDeactivate ? (
            /* Confirmation state */
            <div className="flex-1 flex items-center gap-1.5">
              <button
                onClick={() => {
                  setConfirmDeactivate(false);
                  onDeactivate(member);
                }}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeactivate(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-zinc-100 hover:border-rose-100 transition-colors"
              title="Deactivate — removes login access"
            >
              <ShieldOff className="w-3 h-3" aria-hidden="true" />
            </button>
          )
        ) : (
          <button
            onClick={() => onReactivate(member)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 border border-zinc-100 hover:border-emerald-100 transition-colors"
            title="Reactivate"
          >
            <ShieldCheck className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────

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
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      staffDepartment: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      toast.success("Staff member added");
      form.reset();
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to create staff member");
    },
  });

  function handleSubmit(values: CreateFormValues) {
    mutation.mutate(values);
  }

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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Sarah" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Yılmaz" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="sarah@grandhotel.com"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department */}
            <FormField
              control={form.control}
              name="staffDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
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
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full inline-block",
                                  c.bg.replace("bg-", "bg-").replace("-50", "-400"),
                                )}
                              />
                              {DEPARTMENT_LABELS[dept]}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
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

// ── Edit modal ────────────────────────────────────────────────────────────────

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
    onSuccess: () => {
      toast.success("Staff member updated");
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update staff member");
    },
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
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="staffDepartment"
              render={({ field }) => (
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
              )}
            />

            {/* Email — read-only display */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-700">Email</p>
              <p className="text-sm text-zinc-500 font-mono bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 truncate">
                {member.email}
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
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

// ── Main tab component ────────────────────────────────────────────────────────

export function StaffTeamTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: STAFF_QUERY_KEY,
    queryFn: listStaff,
    staleTime: 30_000,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => {
      toast.success("Staff member deactivated");
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to deactivate"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => updateStaff(id, { isActive: true }),
    onSuccess: () => {
      toast.success("Staff member reactivated");
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to reactivate"),
  });

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY }),
    [queryClient]
  );

  const activeStaff   = (staff ?? []).filter((m) => m.isActive);
  const inactiveStaff = (staff ?? []).filter((m) => !m.isActive);

  return (
    <div className="space-y-5 pb-10">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Team Members</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {isLoading ? "Loading…" : `${activeStaff.length} active`}
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 px-3.5 rounded-xl text-[13px] font-medium shadow-sm shadow-zinc-900/10"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Staff
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (staff ?? []).length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700">No staff members yet</p>
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

      {/* Active staff grid */}
      {activeStaff.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeStaff.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              onEdit={setEditTarget}
              onDeactivate={(m) => deactivateMutation.mutate(m.id)}
              onReactivate={(m) => reactivateMutation.mutate(m.id)}
            />
          ))}
        </div>
      )}

      {/* Inactive staff — collapsed section */}
      {inactiveStaff.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            Inactive ({inactiveStaff.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inactiveStaff.map((member) => (
              <StaffCard
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

      {/* Modals */}
      <CreateStaffModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          invalidate();
        }}
      />

      <EditStaffModal
        member={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          invalidate();
        }}
      />
    </div>
  );
}
