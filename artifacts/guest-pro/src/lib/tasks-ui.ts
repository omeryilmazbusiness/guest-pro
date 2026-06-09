/**
 * Shared Tasks tab design tokens — icon-first, soft color accents.
 */

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Check,
  Circle,
  LayoutGrid,
  Play,
} from "lucide-react";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { TaskStatusFilter } from "@/lib/tasks-schedule";

export const tasksCard =
  "rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-900/[0.03]";

export const tasksTableOuter = "overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/30";

export const tasksTableStickyCol =
  "sticky left-0 z-20 border-slate-100 bg-white/95 backdrop-blur-sm shadow-[4px_0_10px_-6px_rgba(15,23,42,0.12)]";

export const tasksTableHeaderCell =
  "border-b border-slate-100 bg-slate-50/90 text-[10px] font-semibold uppercase tracking-wide text-slate-500";

export const tasksTableHourCell =
  "border-b border-l border-slate-100/80 bg-slate-50/50 px-0 py-1.5 text-center align-middle";

export const tasksIconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 touch-manipulation disabled:opacity-40";

export const tasksIconBtnPrimary =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm transition-all hover:bg-slate-700 active:scale-95 touch-manipulation";

export const tasksChipBtn =
  "inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 min-w-[2.85rem] touch-manipulation ring-1 transition-all active:scale-95 disabled:opacity-40";

export const tasksChipLabel =
  "max-w-[3.5rem] truncate text-center text-[9px] font-semibold leading-none";

export const tasksScrollHint =
  "mt-1 flex items-center justify-center gap-1 text-[9px] font-medium text-slate-400 sm:hidden";

export type SectionAccent = "sky" | "violet" | "rose" | "emerald" | "indigo" | "amber";

export const SECTION_ACCENT: Record<SectionAccent, string> = {
  sky: "bg-sky-500 text-white ring-sky-200/80",
  violet: "bg-violet-500 text-white ring-violet-200/80",
  rose: "bg-rose-500 text-white ring-rose-200/80",
  emerald: "bg-emerald-500 text-white ring-emerald-200/80",
  indigo: "bg-indigo-500 text-white ring-indigo-200/80",
  amber: "bg-amber-500 text-white ring-amber-200/80",
};

export const SECTION_BORDER: Record<SectionAccent, string> = {
  sky: "border-t-sky-400",
  violet: "border-t-violet-400",
  rose: "border-t-rose-400",
  emerald: "border-t-emerald-400",
  indigo: "border-t-indigo-400",
  amber: "border-t-amber-400",
};

export const STATUS_LEGEND = [
  { key: "pending", dot: "bg-amber-400", labelKey: "tasksStatusPending" as const },
  { key: "in_progress", dot: "bg-sky-400", labelKey: "tasksStatusInProgress" as const },
  { key: "completed", dot: "bg-emerald-400", labelKey: "tasksStatusCompleted" as const },
  { key: "overdue", dot: "bg-rose-400", labelKey: "tasksOverdueTitle" as const },
];

export const STATUS_FILTER_CONFIG: Record<
  TaskStatusFilter,
  {
    icon: LucideIcon;
    activeClass: string;
    label: (t: StaffTranslations) => string;
    aria: (t: StaffTranslations) => string;
  }
> = {
  all: {
    icon: LayoutGrid,
    activeClass: "bg-slate-800 text-white ring-slate-700",
    label: (t) => t.tasksFilterAllShort,
    aria: (t) => t.tasksFilterAll,
  },
  pending: {
    icon: Circle,
    activeClass: "bg-amber-500 text-white ring-amber-400",
    label: (t) => t.tasksStatusPendingShort,
    aria: (t) => t.tasksStatusPending,
  },
  in_progress: {
    icon: Play,
    activeClass: "bg-sky-500 text-white ring-sky-400",
    label: (t) => t.tasksStatusInProgressShort,
    aria: (t) => t.tasksStatusInProgress,
  },
  completed: {
    icon: Check,
    activeClass: "bg-emerald-500 text-white ring-emerald-400",
    label: (t) => t.tasksStatusCompletedShort,
    aria: (t) => t.tasksStatusCompleted,
  },
  overdue: {
    icon: AlertCircle,
    activeClass: "bg-rose-500 text-white ring-rose-400",
    label: (t) => t.tasksOverdueShort,
    aria: (t) => t.tasksOverdueTitle,
  },
};

export const FILTER_DOT: Partial<Record<TaskStatusFilter, string>> = {
  pending: "text-amber-500",
  in_progress: "text-sky-500",
  completed: "text-emerald-500",
  overdue: "text-rose-500",
};
