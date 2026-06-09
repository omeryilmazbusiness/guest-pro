/**
 * TasksTableExpandSheet — large popup for full-width schedule table access.
 */

import type { LucideIcon } from "lucide-react";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { SECTION_ACCENT, type SectionAccent } from "@/lib/tasks-ui";
import { cn } from "@/lib/utils";

interface TasksTableExpandSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  accent?: SectionAccent;
  t: StaffTranslations;
  children: React.ReactNode;
}

export function TasksTableExpandSheet({
  open,
  onClose,
  title,
  icon: Icon,
  accent = "sky",
  t,
  children,
}: TasksTableExpandSheetProps) {
  return (
    <ManagerCenterSheet
      open={open}
      onClose={onClose}
      ariaLabel={title}
      closeLabel={t.cancel}
      className="max-w-[min(96vw,72rem)] max-h-[min(92dvh,880px)] rounded-2xl sm:rounded-3xl"
    >
      <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 py-3 pr-14">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1",
            SECTION_ACCENT[accent],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-800">{title}</h2>
          <p className="text-[10px] text-slate-400">{t.tasksExpandHint}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-4">{children}</div>
    </ManagerCenterSheet>
  );
}
