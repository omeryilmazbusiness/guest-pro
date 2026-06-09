/**
 * DailyTaskInsightSheet — full end-of-day task AI report (stored, no live generation).
 */

import { Brain, Sparkles } from "lucide-react";
import type { DailyTaskInsightRecord } from "@/lib/analytics";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import { Button } from "@/components/ui/button";
import { TaskAiInsightDisplay } from "@/components/manager/tasks/TaskAiInsightDisplay";

interface DailyTaskInsightSheetProps {
  open: boolean;
  onClose: () => void;
  insight: DailyTaskInsightRecord | null;
  t: StaffTranslations;
}

export function DailyTaskInsightSheet({ open, onClose, insight, t }: DailyTaskInsightSheetProps) {
  return (
    <ManagerCenterSheet
      open={open}
      onClose={onClose}
      ariaLabel={t.tasksAiDailyReport}
      closeLabel={t.cancel}
      className="max-w-md"
    >
      <div className="flex max-h-[min(88dvh,560px)] flex-col">
        <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-5 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{t.tasksAiDailyReport}</h2>
              <p className="text-xs text-zinc-500">{t.tasksAiDailyReportHint}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {insight ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
              <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                <Brain className="h-3.5 w-3.5" />
                {t.tasksAiInsight}
              </div>
              <TaskAiInsightDisplay
                data={{
                  summary: insight.summary,
                  finishedOnTime: insight.finishedOnTime,
                  finishedLate: insight.finishedLate,
                  notFinished: insight.notFinished,
                }}
                t={t}
                compact
              />
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-zinc-400">{t.tasksAiOverviewPending}</p>
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-100 px-5 py-4">
          <Button type="button" className="h-10 w-full rounded-2xl" onClick={onClose}>
            {t.cancel}
          </Button>
        </div>
      </div>
    </ManagerCenterSheet>
  );
}
