/**
 * TasksScrollHint — mobile swipe cue with tiny label.
 */

import { MoveHorizontal } from "lucide-react";
import { tasksScrollHint } from "@/lib/tasks-ui";
import type { StaffTranslations } from "@/lib/staff-i18n";

export function TasksScrollHint({ t }: { t: StaffTranslations }) {
  return (
    <p className={tasksScrollHint}>
      <MoveHorizontal className="h-3 w-3 shrink-0" aria-hidden />
      {t.tasksScrollHint}
    </p>
  );
}
