/**
 * TasksSectionHeader — colored icon + small visible label.
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_ACCENT, type SectionAccent } from "@/lib/tasks-ui";

const BADGE: Record<SectionAccent, string> = {
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
  emerald: "bg-emerald-100 text-emerald-700",
  indigo: "bg-indigo-100 text-indigo-700",
  amber: "bg-amber-100 text-amber-700",
};

interface TasksSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  accent?: SectionAccent;
  badge?: number;
  className?: string;
}

export function TasksSectionHeader({
  icon: Icon,
  title,
  accent = "sky",
  badge,
  className,
}: TasksSectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className ?? "mb-2")}>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1",
          SECTION_ACCENT[accent],
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-[11px] font-semibold leading-tight text-slate-700">{title}</span>
      {badge != null && badge > 0 ? (
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", BADGE[accent])}>
          {badge}
        </span>
      ) : null}
    </div>
  );
}
