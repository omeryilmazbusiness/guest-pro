/**
 * TasksIconChip — icon + tiny label (toolbar, filters, actions).
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksChipBtn, tasksChipLabel } from "@/lib/tasks-ui";

interface TasksIconChipProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  activeClass?: string;
  inactiveClass?: string;
  iconClass?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  title?: string;
}

export function TasksIconChip({
  icon: Icon,
  label,
  active = false,
  activeClass = "bg-slate-800 text-white ring-slate-700",
  inactiveClass = "bg-slate-50 text-slate-600 ring-slate-200/70 hover:bg-slate-100",
  iconClass,
  className,
  disabled,
  onClick,
  type = "button",
  ...a11y
}: TasksIconChipProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(tasksChipBtn, active ? activeClass : inactiveClass, disabled && "opacity-40", className)}
      {...a11y}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass, active && "text-inherit")} />
      <span className={cn(tasksChipLabel, active && "text-inherit")}>{label}</span>
    </button>
  );
}

interface TasksTableHeaderIconProps {
  icon: LucideIcon;
  label: string;
  iconClass?: string;
}

export function TasksTableHeaderIcon({ icon: Icon, label, iconClass }: TasksTableHeaderIconProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-1 py-1">
      <Icon className={cn("h-3.5 w-3.5", iconClass ?? "text-slate-500")} aria-hidden />
      <span className="text-[9px] font-semibold leading-none text-slate-600">{label}</span>
    </div>
  );
}
