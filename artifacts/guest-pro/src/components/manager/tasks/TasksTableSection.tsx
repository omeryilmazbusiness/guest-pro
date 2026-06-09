/**
 * TasksTableSection — inline table preview + expand popup for wide access.
 */

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Maximize2 } from "lucide-react";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { tasksCard, tasksIconBtn, SECTION_BORDER, type SectionAccent } from "@/lib/tasks-ui";
import { cn } from "@/lib/utils";
import { TasksSectionHeader } from "@/components/manager/tasks/TasksSectionHeader";
import { TasksTableExpandSheet } from "@/components/manager/tasks/TasksTableExpandSheet";
import { TasksScrollHint } from "@/components/manager/tasks/TasksScrollHint";

interface TasksTableSectionProps {
  icon: LucideIcon;
  title: string;
  /** Modal title — defaults to `title`. */
  modalTitle?: string;
  accent: SectionAccent;
  t: StaffTranslations;
  badge?: number;
  /** Wrap in card shell (default). Set false when nested inside another card. */
  shell?: boolean;
  borderAccent?: boolean;
  showScrollHint?: boolean;
  headerActions?: ReactNode;
  renderContent: (ctx: { embedded: boolean; expanded: boolean }) => ReactNode;
}

export function TasksTableSection({
  icon,
  title,
  modalTitle,
  accent,
  t,
  badge,
  shell = true,
  borderAccent = true,
  showScrollHint = true,
  headerActions,
  renderContent,
}: TasksTableSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const headerRow = (
    <div className="mb-2 flex items-center gap-2">
      <TasksSectionHeader
        icon={icon}
        title={title}
        accent={accent}
        badge={badge}
        className="mb-0 min-w-0 flex-1"
      />
      {headerActions}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={tasksIconBtn}
        aria-label={t.tasksExpandTable}
        title={t.tasksExpandTable}
      >
        <Maximize2 className="h-4 w-4 text-slate-600" />
      </button>
    </div>
  );

  const body = (
    <>
      {headerRow}
      {renderContent({ embedded: true, expanded: false })}
      {showScrollHint ? <TasksScrollHint t={t} /> : null}
      <TasksTableExpandSheet
        open={expanded}
        onClose={() => setExpanded(false)}
        title={modalTitle ?? title}
        icon={icon}
        accent={accent}
        t={t}
      >
        {renderContent({ embedded: false, expanded: true })}
      </TasksTableExpandSheet>
    </>
  );

  if (!shell) {
    return <div>{body}</div>;
  }

  return (
    <section
      className={cn(
        tasksCard,
        "p-2.5 sm:p-3",
        borderAccent && "border-t-2",
        borderAccent && SECTION_BORDER[accent],
      )}
    >
      {body}
    </section>
  );
}
