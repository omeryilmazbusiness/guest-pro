/**
 * ManagerAiInsightCard — premium framed AI insight tile (department manager overview).
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

  const summaryText =
    insight && !pending
      ? hasLists
        ? insight.summary
        : t.tasksAiNobodyOverdue
      : t.tasksAiOverviewPending;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={t.tasksAiAnalysisTitle}
      className={cn(
        "flex h-full w-full flex-col items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-2 py-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "transition-all duration-150 hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/25 touch-manipulation",
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center" aria-hidden>
        <Brain className="guest-chat-entry-icon h-6 w-6 text-violet-600" strokeWidth={1.5} />
      </span>
      <span className="block w-full min-w-0">
        <span className="block text-[8px] font-semibold uppercase tracking-wide text-violet-500">
          {t.tasksAiOverviewLabel}
        </span>
        <span
          className={cn(
            "mt-1 line-clamp-4 text-[9px] font-medium leading-snug",
            pending || !insight ? "text-zinc-400" : "text-zinc-600",
          )}
        >
          {summaryText}
        </span>
      </span>
    </button>
  );
}
