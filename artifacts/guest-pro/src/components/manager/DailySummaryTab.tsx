/**
 * DailySummaryTab — manager-only view of stored daily AI summaries.
 * Shows a list of past daily summaries with compact metrics + AI bullets.
 * Managers can also generate today's summary on demand.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Lightbulb,
  TrendingUp,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Clock,
} from "lucide-react";
import {
  getDailySummaries,
  generateDailySummary,
  formatMinutes,
  TYPE_LABELS,
  type DailySummaryRecord,
  type RequestAnalyticsSnapshot,
} from "@/lib/analytics";
import { toast } from "sonner";

// ─── Sub-components ───────────────────────────────────────────────────────────

function BulletList({ items, dotClass }: { items: string[]; dotClass: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] text-zinc-600 leading-snug">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function MetricsRow({ snapshot }: { snapshot: RequestAnalyticsSnapshot }) {
  const typeEntries = Object.entries(snapshot.byType)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl px-3 py-2 border border-zinc-100 text-center">
          <div className="text-[18px] font-bold text-zinc-900">{snapshot.totalRequests}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Total</div>
        </div>
        <div className="bg-white rounded-2xl px-3 py-2 border border-zinc-100 text-center">
          <div className="text-[18px] font-bold text-zinc-900">{snapshot.byStatus.resolved}</div>
          <div className="text-[10px] text-zinc-400 font-medium">Resolved</div>
        </div>
        <div className="bg-white rounded-2xl px-3 py-2 border border-zinc-100 text-center">
          <div className="text-[18px] font-bold text-zinc-900">
            {formatMinutes(snapshot.avgResolutionMinutes)}
          </div>
          <div className="text-[10px] text-zinc-400 font-medium">Avg Time</div>
        </div>
      </div>

      {typeEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {typeEntries.map(([type, count]) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 bg-white border border-zinc-100 rounded-xl px-2.5 py-1 text-[11px] font-medium text-zinc-600"
            >
              {TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type}
              <span className="text-zinc-400">{count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ summary }: { summary: DailySummaryRecord }) {
  const [expanded, setExpanded] = useState(false);

  const dateObj = new Date(`${summary.date}T12:00:00Z`);
  const isToday = summary.date === new Date().toISOString().slice(0, 10);
  const dateLabel = isToday
    ? "Today"
    : dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  const snapshot = summary.metricsSnapshot;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-zinc-900">{dateLabel}</span>
              {isToday && (
                <span className="text-[10px] font-semibold bg-zinc-900 text-white rounded-full px-2 py-0.5">
                  TODAY
                </span>
              )}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {snapshot.totalRequests} requests ·{" "}
              {snapshot.byStatus.resolved} resolved
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
        )}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-zinc-50 px-4 pb-4 pt-3 space-y-4">
          {/* Metrics */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                Metrics
              </span>
            </div>
            <MetricsRow snapshot={snapshot} />
          </div>

          {/* Longest wait */}
          {snapshot.longestWaitingRequest && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Longest Wait
                </span>
              </div>
              <div className="bg-zinc-50 rounded-xl px-3 py-2 text-[12px] text-zinc-600 flex items-center justify-between gap-2">
                <span>Room {snapshot.longestWaitingRequest.roomNumber}</span>
                <span className="font-mono text-zinc-500">
                  {formatMinutes(snapshot.longestWaitingRequest.minutesWaiting)}
                </span>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {summary.insights.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Insights
                </span>
              </div>
              <BulletList items={summary.insights} dotClass="bg-zinc-400" />
            </div>
          )}

          {/* AI Recommendations */}
          {summary.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Recommendations
                </span>
              </div>
              <BulletList items={summary.recommendations} dotClass="bg-zinc-900" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DailySummaryTab() {
  const queryClient = useQueryClient();

  const { data: summaries, isLoading, isError } = useQuery<DailySummaryRecord[]>({
    queryKey: ["daily-summaries"],
    queryFn: getDailySummaries,
    staleTime: 5 * 60_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateDailySummary(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-summaries"] });
      toast.success("Today's summary generated");
    },
    onError: () => toast.error("Failed to generate summary"),
  });

  const today = new Date().toISOString().slice(0, 10);
  const hasTodaySummary = summaries?.some((s) => s.date === today);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900">Daily Summary</h2>
          <p className="text-[12px] text-zinc-400 mt-0.5">AI-powered daily intelligence</p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 touch-manipulation"
        >
          {generateMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {hasTodaySummary ? "Refresh Today" : "Generate Today"}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-zinc-300 animate-spin" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-10 text-[13px] text-zinc-400">
          Failed to load summaries. Try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && summaries?.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <Calendar className="w-8 h-8 text-zinc-200 mx-auto" />
          <p className="text-[14px] font-medium text-zinc-400">No summaries yet</p>
          <p className="text-[12px] text-zinc-400">
            Summaries are auto-generated at 23:30 each night, or you can generate one now.
          </p>
        </div>
      )}

      {/* Summary list */}
      {summaries && summaries.length > 0 && (
        <div className="space-y-2.5">
          {summaries.map((s) => (
            <SummaryCard key={s.id} summary={s} />
          ))}
        </div>
      )}
    </div>
  );
}
