/**
 * TaskPerformanceSection — chart + AI, icon-first headers.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Brain, Loader2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { StaffTranslations } from "@/lib/staff-i18n";
import type { StaffTask } from "@/lib/tasks";
import { buildTaskPerformanceChart } from "@/lib/tasks-performance";
import { getTaskPerformanceReport, getDailyTaskInsight } from "@/lib/analytics";
import { tasksCard, tasksIconBtn, SECTION_BORDER } from "@/lib/tasks-ui";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DailyTaskInsightSheet } from "@/components/manager/DailyTaskInsightSheet";
import { TaskAiInsightDisplay } from "@/components/manager/tasks/TaskAiInsightDisplay";
import { TasksSectionHeader } from "@/components/manager/tasks/TasksSectionHeader";
import { cn } from "@/lib/utils";

const chartConfig = {
  onTimeRate: {
    label: "On-time %",
    color: "hsl(160 84% 39%)",
  },
};

interface TaskPerformanceSectionProps {
  tasks: StaffTask[];
  periodFrom: string;
  periodTo: string;
  locale: string;
  t: StaffTranslations;
}

export function TaskPerformanceSection({
  tasks,
  periodFrom,
  periodTo,
  locale,
  t,
}: TaskPerformanceSectionProps) {
  const [reportOpen, setReportOpen] = useState(false);

  const chartData = useMemo(() => buildTaskPerformanceChart(tasks), [tasks]);

  const {
    data: aiReport,
    isLoading: aiLoading,
    isError: aiError,
    refetch: refetchAi,
  } = useQuery({
    queryKey: ["tasks-ai-report", periodFrom, periodTo, locale],
    queryFn: () => getTaskPerformanceReport(periodFrom, periodTo, locale),
    staleTime: 60_000,
    retry: 1,
  });

  const { data: storedInsight } = useQuery({
    queryKey: ["daily-task-insight-modal", locale],
    queryFn: () => getDailyTaskInsight(locale),
    enabled: reportOpen,
    staleTime: 60_000,
  });

  if (tasks.length === 0) return null;

  return (
    <>
      <section className={cn(tasksCard, "overflow-hidden border-t-2", SECTION_BORDER.emerald)}>
        <div className="p-2.5 sm:p-3">
          <TasksSectionHeader icon={TrendingUp} title={t.tasksPerformanceShort} accent="emerald" />
          {chartData.length === 0 ? (
            <div className="flex justify-center py-8 text-slate-300">
              <TrendingUp className="h-8 w-8" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[160px] w-full aspect-auto sm:h-[180px]">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <span className="font-medium tabular-nums">
                          {value}% · {item.payload.completed}
                        </span>
                      )}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="onTimeRate"
                  stroke="var(--color-onTimeRate)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-onTimeRate)", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        <div className="border-t border-indigo-100/80 bg-gradient-to-br from-indigo-50/60 to-violet-50/30 p-2.5 sm:p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <TasksSectionHeader icon={Brain} title={t.tasksAiShort} accent="indigo" className="mb-0" />
            <button
              type="button"
              className={tasksIconBtn}
              disabled={aiReport?.insightPending}
              onClick={() => setReportOpen(true)}
              aria-label={t.tasksAiDailyReport}
              title={t.tasksAiDailyReport}
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </button>
          </div>

          {aiLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            </div>
          ) : aiError ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <button
                type="button"
                onClick={() => refetchAi()}
                className={tasksIconBtn}
                aria-label={t.tasksAiRetry}
                title={t.tasksAiRetry}
              >
                <RefreshCw className="h-4 w-4 text-rose-600" />
              </button>
            </div>
          ) : aiReport?.insightPending ? (
            <p className="rounded-xl bg-white/60 px-3 py-3 text-[13px] leading-relaxed text-slate-600 ring-1 ring-indigo-100">
              {aiReport.aiSummary}
            </p>
          ) : aiReport?.aiSummary ? (
            <TaskAiInsightDisplay
              data={{
                summary: aiReport.aiSummary,
                finishedOnTime: aiReport.aiFinishedOnTime,
                finishedLate: aiReport.aiFinishedLate,
                notFinished: aiReport.aiNotFinished,
                employeeNotes: aiReport.aiEmployeeNotes,
              }}
              t={t}
            />
          ) : null}
        </div>
      </section>

      <DailyTaskInsightSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        insight={storedInsight ?? null}
        t={t}
      />
    </>
  );
}
