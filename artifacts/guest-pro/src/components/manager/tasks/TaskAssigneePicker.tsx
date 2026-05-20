/**
 * TaskAssigneePicker — employee combobox for task sheets inside ManagerCenterSheet.
 *
 * Radix Select dropdown (z-50) renders behind the center sheet (z-120).
 * This popover uses z-[130], matching CreateGuestSheet country picker.
 */

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DEPARTMENT_LABELS,
  staffDisplayName,
  type StaffDepartment,
  type StaffMember,
} from "@/lib/staff";

const pickerTriggerClass =
  "flex h-9 w-full items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50";

interface TaskAssigneePickerProps {
  staff: StaffMember[];
  value: string | undefined;
  onChange: (assigneeUserId: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
  isLoading?: boolean;
  "aria-invalid"?: boolean;
}

export function TaskAssigneePicker({
  staff,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled,
  isLoading,
  "aria-invalid": ariaInvalid,
}: TaskAssigneePickerProps) {
  const [open, setOpen] = useState(false);

  const activeStaff = useMemo(
    () =>
      staff
        .filter((m) => m.isActive)
        .sort((a, b) => staffDisplayName(a).localeCompare(staffDisplayName(b))),
    [staff],
  );

  const selected = useMemo(
    () => activeStaff.find((m) => String(m.id) === value),
    [activeStaff, value],
  );

  const deptLabel = (dept: StaffDepartment | null) =>
    dept ? DEPARTMENT_LABELS[dept] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled || isLoading || activeStaff.length === 0}
          className={cn(
            pickerTriggerClass,
            selected ? "text-zinc-900" : "text-zinc-400",
            ariaInvalid && "border-red-300 ring-1 ring-red-200",
          )}
        >
          <Users className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="min-w-0 flex-1 truncate text-left font-medium">
            {isLoading
              ? "…"
              : selected
                ? staffDisplayName(selected)
                : activeStaff.length === 0
                  ? emptyLabel
                  : placeholder}
          </span>
          {selected?.staffDepartment && (
            <span className="hidden shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 sm:inline">
              {deptLabel(selected.staffDepartment)}
            </span>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[130] w-[var(--radix-popover-trigger-width)] rounded-xl border-zinc-100 p-0 shadow-xl"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9 border-0 text-sm" />
          <CommandList className="max-h-52">
            <CommandEmpty className="py-6 text-center text-xs text-zinc-400">
              {emptyLabel}
            </CommandEmpty>
            <CommandGroup>
              {activeStaff.map((member) => {
                const name = staffDisplayName(member);
                const isSelected = String(member.id) === value;
                return (
                  <CommandItem
                    key={member.id}
                    value={`${name} ${member.email} ${member.staffDepartment ?? ""}`}
                    onSelect={() => {
                      onChange(String(member.id));
                      setOpen(false);
                    }}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                      {name}
                    </span>
                    {member.staffDepartment && (
                      <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                        {deptLabel(member.staffDepartment)}
                      </span>
                    )}
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-zinc-900",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
