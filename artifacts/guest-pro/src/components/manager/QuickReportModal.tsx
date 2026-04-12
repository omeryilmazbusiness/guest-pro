/**
 * QuickReportModal — on-demand live intelligence snapshot for managers.
 * Shows today's request metrics + AI insights + AI recommendations.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  TrendingUp,
  Clock,
  AlertCircle,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getQuickReport, formatMinutes, TYPE_LABELS, type QuickReportResponse } from "@/lib/analytics";

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuickReportModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-zinc-50 rounded-2xl px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
      <span className="text-[22px] font-bold text-zinc-900 leading-none">{value}</span>
      {sub && <span className="text-[11px] text-zinc-400">{sub}</span>}
    </div>
  );
}

function StatusBar({ byStatus, total }: { byStatus: QuickReportResponse["byStatus"]; total: number }) {
  if (total === 0) return null;
  const openPct = Math.round((byStatus.open / total) * 100);
  const inProgressPct = Math.round((byStatus.in_progress / total) * 100);
  const resolvedPct = 100 - openPct - inProgressPct;

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {byStatus.open > 0 && (
          <div className="bg-amber-400 rounded-full" style={{ width: `${openPct}%` }} />
        )}
        {byStatus.in_progress > 0 && (
          <div className="bg-sky-400 rounded-full" style={{ width: `${inProgressPct}%` }} />
        )}
        {byStatus.resolved > 0 && (
          <div className="bg-emerald-400 rounded-full" style={{ width: `${resolvedPct}%` }} />
        )}
      </div>
      <div className="flex gap-4 text-[11px] font-medium">
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Open {byStatus.open}
        </span>
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
          In Progress {byStatus.in_progress}
        </span>
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          Resolved {byStatus.resolved}
        </span>
      </div>
    </div>
  );
}

function TypeBreakdown({ byType }: { byType: QuickReportResponse["byType"] }) {
  const entries = Object.entries(byType)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {entries.map(([type, count]) => (
        <div key={type} className="flex items-center justify-between">
          <span className="text-[13px] text-zinc-600">
            {TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type}
          </span>
          <span className="text-[13px] font-semibold text-zinc-900">{count}</span>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] text-zinc-700 leading-snug">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuickReportModal({ open, onClose }: QuickReportModalProps) {
  const [refetchKey, setRefetchKey] = useState(0);

  const { data, isLoading, isError } = useQuery<QuickReportResponse>({
    queryKey: ["quick-report", refetchKey],
    queryFn: getQuickReport,
    enabled: open,
    staleTime: 0,
  });

  if (!open) return null;

  const handleRefresh = () => setRefetchKey((k) => k + 1);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg sm:mx-4 bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="text-[17px] font-semibold text-zinc-900">Quick Report</h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">{today} · Live</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
              <p className="text-[13px] text-zinc-400">Generating live report…</p>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-red-600 text-[13px] py-8 justify-center">
              <AlertCircle className="w-4 h-4" />
              Failed to load report. Please try again.
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* KPI row */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                    Today's Metrics
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <KpiCard label="Total" value={data.totalRequests} sub="requests today" />
                  <KpiCard
                    label="Avg Resolution"
                    value={formatMinutes(data.avgResolutionMinutes)}
                    sub={data.avgResolutionMinutes !== null ? "to resolve" : "no resolved yet"}
                  />
                </div>
              </div>

              {/* Status bar */}
              {data.totalRequests > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                      Status
                    </span>
                  </div>
                  <StatusBar byStatus={data.byStatus} total={data.totalRequests} />
                </div>
              )}

              {/* Longest waiting */}
              {data.longestWaitingRequest && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                      Longest Waiting
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-amber-700">
                        Room {data.longestWaitingRequest.roomNumber}
                      </span>
                      <span className="text-[12px] font-mono font-semibold text-amber-600">
                        {formatMinutes(data.longestWaitingRequest.minutesWaiting)}
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-600 leading-snug">
                      {data.longestWaitingRequest.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Type breakdown */}
              {data.totalRequests > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                      By Category
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl px-4 py-3">
                    <TypeBreakdown byType={data.byType} />
                    {Object.values(data.byType).every((c) => c === 0) && (
                      <p className="text-[13px] text-zinc-400">No requests yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Top rooms */}
              {data.topRooms.filter((r) => r.count > 1).length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                      Active Rooms
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.topRooms.filter((r) => r.count > 0).map((r) => (
                      <div
                        key={r.roomNumber}
                        className="bg-zinc-100 rounded-xl px-3 py-1.5 flex items-center gap-1.5"
                      >
                        <span className="text-[12px] font-semibold text-zinc-700">
                          Room {r.roomNumber}
                        </span>
                        <span className="text-[11px] text-zinc-400">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {data.insights.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Lightbulb className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                      Insights
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl px-4 py-3">
                    <BulletList items={data.insights} color="bg-zinc-400" />
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              {data.recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                      Recommendations
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl px-4 py-3">
                    <BulletList items={data.recommendations} color="bg-zinc-900" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer safe area */}
        <div className="h-safe-bottom shrink-0" />
      </div>
    </div>
  );
}
