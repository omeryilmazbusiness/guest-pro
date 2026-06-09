/**
 * DailyTaskInsightBanner — icon + summary + small action label.
 */

import { Brain, ChevronRight } from "lucide-react";
import type { DailyTaskInsightRecord } from "@/lib/analytics";
import type { StaffTranslations } from "@/lib/staff-i18n";

interface DailyTaskInsightBannerProps {
  insight: DailyTaskInsightRecord;
  t: StaffTranslations;
  onOpen: () => void;
}

export function DailyTaskInsightBanner({ insight, t, onOpen }: DailyTaskInsightBannerProps) {
  return (
    <div className="fixed left-0 right-0 top-14 z-40 px-3 sm:px-4 pointer-events-none">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-2.5 rounded-2xl border border-indigo-200/50 bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2.5 text-left text-white shadow-lg shadow-indigo-900/15 transition-transform active:scale-[0.99] touch-manipulation"
      >
        <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-white/15">
          <Brain className="h-3.5 w-3.5" />
          <span className="mt-0.5 text-[8px] font-semibold leading-none">{t.tasksAiShort}</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug">
          {insight.summary}
        </span>
        <span className="flex shrink-0 flex-col items-center gap-0.5 text-white/90">
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="text-[8px] font-semibold leading-none">{t.tasksAiDailyBannerAction}</span>
        </span>
      </button>
    </div>
  );
}
