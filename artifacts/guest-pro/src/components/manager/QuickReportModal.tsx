/**
 * QuickReportModal — live complaint-focused operational intelligence for managers.
 *
 * Layout (complaint-first):
 *   1. Situation header — unresolved count, urgent alert badge
 *   2. Needs Attention — active issues sorted oldest-first, urgent highlighted in red
 *   3. Status strip — mini bar + counts
 *   4. Hot Rooms — rooms with 2+ requests
 *   5. AI Summary — 2-3 bullets (current situation)
 *   6. AI Complaint Analysis — 3-5 bullets (main 80% section)
 *   7. Timing — KPI cards + AI timing insights
 *   8. AI Recommendations
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  TrendingUp,
  Clock,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Loader2,
  AlertCircle,
  Activity,
  Flame,
} from "lucide-react";
import {
  getQuickReport,
  formatMinutes,
  TYPE_LABELS,
  TYPE_COLORS,
  type QuickReportResponse,
  type ActiveIssue,
} from "@/lib/analytics";

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuickReportModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({
  icon,
  label,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-zinc-400">{icon}</span>
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
        {label}
      </span>
      {badge !== undefined && badge !== 0 && (
        <span className="ml-1 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </div>
  );
}

function ActiveIssueCard({ issue }: { issue: ActiveIssue }) {
  const urgent = issue.isUrgent;
  const inProgress = issue.status === "in_progress";

  return (
    <div
      className={`rounded-2xl px-3.5 py-2.5 space-y-1 border ${
        urgent
          ? "bg-red-50 border-red-100"
          : inProgress
          ? "bg-sky-50 border-sky-100"
          : "bg-amber-50 border-amber-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              urgent
                ? "bg-red-100 text-red-700"
                : inProgress
                ? "bg-sky-100 text-sky-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {urgent ? "URGENT" : inProgress ? "IN PROGRESS" : "OPEN"}
          </span>
          <span className={`text-[11px] font-semibold truncate ${urgent ? "text-red-700" : inProgress ? "text-sky-700" : "text-amber-700"}`}>
            Room {issue.roomNumber}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLORS[issue.requestType]}`}>
            {TYPE_LABELS[issue.requestType]}
          </span>
        </div>
        <span
          className={`shrink-0 text-[11px] font-mono font-semibold ${
            urgent ? "text-red-600" : inProgress ? "text-sky-600" : "text-amber-600"
          }`}
        >
          {formatMinutes(issue.minutesWaiting)}
        </span>
      </div>
      <p className="text-[12px] text-zinc-600 leading-snug line-clamp-2">
        {issue.summary}
      </p>
      {issue.guestName && (
        <p className="text-[10px] text-zinc-400">{issue.guestName}</p>
      )}
    </div>
  );
}

function StatusStrip({
  byStatus,
  total,
}: {
  byStatus: QuickReportResponse["byStatus"];
  total: number;
}) {
  if (total === 0) return null;
  const openPct = Math.round((byStatus.open / total) * 100);
  const inProgressPct = Math.round((byStatus.in_progress / total) * 100);
  const resolvedPct = 100 - openPct - inProgressPct;

  return (
    <div className="space-y-2">
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
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
      <div className="flex gap-3 text-[11px] font-medium">
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Open {byStatus.open}
        </span>
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
          In Progress {byStatus.in_progress}
        </span>
        <span className="flex items-center gap-1 text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Resolved {byStatus.resolved}
        </span>
      </div>
    </div>
  );
}

function BulletList({
  items,
  accentClass,
}: {
  items: string[];
  accentClass: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] text-zinc-700 leading-snug">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${accentClass}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function TimingKpis({ data }: { data: QuickReportResponse }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-zinc-50 rounded-2xl px-4 py-3 flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
          Avg Resolution
        </span>
        <span className="text-[20px] font-bold text-zinc-900 leading-none">
          {formatMinutes(data.avgResolutionMinutes)}
        </span>
        <span className="text-[11px] text-zinc-400">
          {data.avgResolutionMinutes !== null ? "to resolve" : "no resolved yet"}
        </span>
      </div>
      <div className="bg-zinc-50 rounded-2xl px-4 py-3 flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
          Longest Wait
        </span>
        <span
          className={`text-[20px] font-bold leading-none ${
            data.longestWaitingMinutes && data.longestWaitingMinutes >= 45
              ? "text-red-600"
              : "text-zinc-900"
          }`}
        >
          {formatMinutes(data.longestWaitingMinutes)}
        </span>
        <span className="text-[11px] text-zinc-400">
          {data.longestWaitingRequest
            ? `Room ${data.longestWaitingRequest.roomNumber}`
            : "no active requests"}
        </span>
      </div>
    </div>
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

  const urgentCount = data?.urgentIssues.length ?? 0;
  const unresolved = data ? data.byStatus.open + data.byStatus.in_progress : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg sm:mx-4 bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-zinc-100 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold text-zinc-900">Quick Report</h2>
              {urgentCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  {urgentCount} urgent
                </span>
              )}
            </div>
            <p className="text-[12px] text-zinc-400">{today} · Live</p>
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

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
              <p className="text-[13px] text-zinc-400">Analyzing requests…</p>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex items-center gap-2 text-red-600 text-[13px] py-8 justify-center">
              <AlertCircle className="w-4 h-4" />
              Failed to load report. Please try again.
            </div>
          )}

          {data && !isLoading && (
            <>
              {/* ── 1. Situation header ──────────────────────────────────── */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 rounded-2xl px-4 py-2.5 flex flex-col ${
                    urgentCount > 0
                      ? "bg-red-50 border border-red-100"
                      : unresolved > 0
                      ? "bg-amber-50 border border-amber-100"
                      : "bg-emerald-50 border border-emerald-100"
                  }`}
                >
                  <span
                    className={`text-[22px] font-bold leading-none ${
                      urgentCount > 0
                        ? "text-red-700"
                        : unresolved > 0
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {unresolved}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      urgentCount > 0
                        ? "text-red-500"
                        : unresolved > 0
                        ? "text-amber-500"
                        : "text-emerald-600"
                    }`}
                  >
                    unresolved requests
                  </span>
                </div>
                <div className="flex-1 rounded-2xl px-4 py-2.5 bg-zinc-50 border border-zinc-100 flex flex-col">
                  <span className="text-[22px] font-bold text-zinc-900 leading-none">
                    {data.totalRequests}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400">
                    total today
                  </span>
                </div>
              </div>

              {/* ── 2. Needs Attention (active issues) ───────────────────── */}
              {data.activeIssues.length > 0 && (
                <div>
                  <div className="mb-2.5">
                    <SectionHeading
                      icon={<AlertTriangle className="w-3.5 h-3.5" />}
                      label="Needs Attention"
                      badge={data.activeIssues.length}
                    />
                  </div>
                  <div className="space-y-2">
                    {data.activeIssues.slice(0, 8).map((issue) => (
                      <ActiveIssueCard key={issue.id} issue={issue} />
                    ))}
                    {data.activeIssues.length > 8 && (
                      <p className="text-[11px] text-zinc-400 text-center py-1">
                        +{data.activeIssues.length - 8} more active requests
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── 3. Status strip ──────────────────────────────────────── */}
              {data.totalRequests > 0 && (
                <div>
                  <div className="mb-2">
                    <SectionHeading
                      icon={<Activity className="w-3.5 h-3.5" />}
                      label="Status"
                    />
                  </div>
                  <StatusStrip byStatus={data.byStatus} total={data.totalRequests} />
                </div>
              )}

              {/* ── 4. Hot Rooms ─────────────────────────────────────────── */}
              {data.hotRooms.length > 0 && (
                <div>
                  <div className="mb-2.5">
                    <SectionHeading
                      icon={<Flame className="w-3.5 h-3.5" />}
                      label="Repeated Requests"
                    />
                  </div>
                  <div className="space-y-2">
                    {data.hotRooms.slice(0, 4).map((room) => (
                      <div
                        key={room.roomNumber}
                        className="bg-zinc-50 rounded-2xl px-4 py-2.5 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold text-zinc-800">
                              Room {room.roomNumber}
                            </span>
                            {room.openCount > 0 && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                {room.openCount} open
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 line-clamp-1">
                            {room.summaries.join(" · ")}
                          </p>
                        </div>
                        <span className="shrink-0 text-[20px] font-bold text-zinc-300 leading-none">
                          {room.totalCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 5. AI Summary ────────────────────────────────────────── */}
              {data.summary.length > 0 && (
                <div>
                  <div className="mb-2.5">
                    <SectionHeading
                      icon={<Lightbulb className="w-3.5 h-3.5" />}
                      label="Summary"
                    />
                  </div>
                  <div className="bg-zinc-50 rounded-2xl px-4 py-3">
                    <BulletList items={data.summary} accentClass="bg-zinc-400" />
                  </div>
                </div>
              )}

              {/* ── 6. AI Complaint Analysis (MAIN 80% section) ──────────── */}
              {data.complaintAnalysis.length > 0 && (
                <div>
                  <div className="mb-2.5">
                    <SectionHeading
                      icon={<AlertCircle className="w-3.5 h-3.5" />}
                      label="Complaint Analysis"
                    />
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                    <BulletList items={data.complaintAnalysis} accentClass="bg-red-400" />
                  </div>
                </div>
              )}

              {/* ── 7. Timing ─────────────────────────────────────────────── */}
              <div>
                <div className="mb-2.5">
                  <SectionHeading
                    icon={<Clock className="w-3.5 h-3.5" />}
                    label="Timing"
                  />
                </div>
                <div className="space-y-3">
                  <TimingKpis data={data} />
                  {data.timingInsights.length > 0 && (
                    <div className="bg-zinc-50 rounded-2xl px-4 py-3">
                      <BulletList items={data.timingInsights} accentClass="bg-sky-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* ── 8. AI Recommendations ─────────────────────────────────── */}
              {data.recommendations.length > 0 && (
                <div>
                  <div className="mb-2.5">
                    <SectionHeading
                      icon={<TrendingUp className="w-3.5 h-3.5" />}
                      label="Recommendations"
                    />
                  </div>
                  <div className="bg-zinc-50 rounded-2xl px-4 py-3">
                    <BulletList items={data.recommendations} accentClass="bg-zinc-900" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer safe area */}
        <div className="h-safe-bottom shrink-0 pb-2" />
      </div>
    </div>
  );
}
