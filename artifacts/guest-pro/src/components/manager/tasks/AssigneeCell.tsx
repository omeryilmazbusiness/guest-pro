/**
 * AssigneeCell — assignee name with avatar initials for task tables.
 */

import { cn } from "@/lib/utils";
import { assigneeDisplayName, type TaskAssignee } from "@/lib/tasks";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface AssigneeCellProps {
  assignee: TaskAssignee;
  className?: string;
}

export function AssigneeCell({ assignee, className }: AssigneeCellProps) {
  const name = assigneeDisplayName(assignee);

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200/80"
        aria-hidden
      >
        {initials(name)}
      </span>
      <span className="truncate text-[13px] font-medium text-zinc-800">{name}</span>
    </div>
  );
}
