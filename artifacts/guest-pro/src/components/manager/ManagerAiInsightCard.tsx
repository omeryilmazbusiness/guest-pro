/**
 * ManagerAiInsightCard — square AI daily insight preview (department manager overview).
 */

import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyTaskInsightRecord } from "@/lib/analytics";
import type { StaffTranslations } from "@/lib/staff-i18n";

interface ManagerAiInsightCardProps {
  insight: DailyTaskInsightRecord | null | undefined;
  pending?: boolean;
  t: StaffTranslations;
  onPress: () => void;
}

export function ManagerAiInsightCard({
  insight,
  pending = false,
  t,
  onPress,
}: ManagerAiInsightCardProps) {
  const hasLists =
    insight &&
    (insight.finishedOnTime.length > 0 ||
      insight.finishedLate.length > 0 ||
      insight.notFinished.length > 0);

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={t.tasksAiAnalysisTitle}
      className={cn(
        "flex aspect-square w-[5.75rem] shrink-0 flex-col justify-between rounded-2xl border p-2.5 text-left shadow-sm transition-transform touch-manipulation",
        "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
        pending || !insight
          ? "border-violet-100 bg-violet-50/60"
          : "border-violet-200 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-300/30",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          pending || !insight ? "bg-violet-100 text-violet-600" : "bg-white/15 text-white",
        )}
      >
        <Brain className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block text-[9px] font-semibold uppercase tracking-wide leading-none",
            pending || !insight ? "text-violet-600" : "text-violet-100",
          )}
        >
          {t.tasksAiOverviewLabel}
        </span>
        <span
          className={cn(
            "mt-1 line-clamp-3 text-[10px] font-medium leading-snug",
            pending || !insight ? "text-violet-900/70" : "text-white/95",
          )}
        >
          {insight && !pending
            ? hasLists
              ? insight.summary
              : t.tasksAiNobodyOverdue
            : t.tasksAiOverviewPending}
        </span>
      </span>
    </button>
  );
}
