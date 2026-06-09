/**
 * ai-summary.ts
 * AI analysis pipelines for manager intelligence.
 *
 * Two distinct generators:
 *   generateQuickReportAI  — complaint/issue-focused, 4-section output, for live modal
 *   generateDailySummaryAI — operational overview, 2-section output, for nightly storage
 *
 * All prompt engineering lives here. No AI calls outside this module.
 */

import type { RequestAnalyticsSnapshot } from "./request-analytics";
import { runManagerGeminiJson } from "./hotel-ai/run-manager-gemini";
import type { HotelAiUsageSnapshot } from "./hotel-ai/types";

// ─── Output types ─────────────────────────────────────────────────────────────

/** Quick Report: 4-section output with strong complaint focus */
export interface QuickReportAIOutput {
  summary: string[];
  complaintAnalysis: string[];
  timingInsights: string[];
  recommendations: string[];
}

/** Daily Summary: 2-section operational overview */
export interface AIInsightOutput {
  insights: string[];
  recommendations: string[];
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const QUICK_REPORT_FALLBACK: QuickReportAIOutput = {
  summary: ["No significant patterns detected for this period."],
  complaintAnalysis: ["No active complaints or recurring issues identified."],
  timingInsights: ["Insufficient data for timing analysis."],
  recommendations: ["Continue monitoring requests as they arrive."],
};

const DAILY_FALLBACK: AIInsightOutput = {
  insights: ["Not enough data to generate insights for this period."],
  recommendations: ["Continue monitoring request patterns over the coming days."],
};

// ─── Type label map ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  FOOD_ORDER: "Food Order",
  SUPPORT_REQUEST: "Support / Complaint",
  CARE_PROFILE_UPDATE: "Care Preference",
  GENERAL_SERVICE_REQUEST: "General Service",
};

// ─── Quick Report prompt builder ──────────────────────────────────────────────

function buildQuickReportPrompt(snapshot: RequestAnalyticsSnapshot): string {
  const unresolved = snapshot.byStatus.open + snapshot.byStatus.in_progress;

  // Active issues: oldest first (highest urgency)
  const activeLines = snapshot.activeIssues
    .slice(0, 20)
    .map((i) => {
      const urgentFlag = i.isUrgent ? " [URGENT]" : "";
      return `  - Room ${i.roomNumber} | ${i.guestName} | ${TYPE_LABELS[i.requestType] ?? i.requestType} | ${i.status.toUpperCase()}${urgentFlag} | waiting ${i.minutesWaiting}m: "${i.summary}"`;
    })
    .join("\n") || "  - None";

  // Urgent issues only
  const urgentLines = snapshot.urgentIssues.length > 0
    ? snapshot.urgentIssues
        .slice(0, 10)
        .map((i) => `  - Room ${i.roomNumber}: "${i.summary}" (${i.minutesWaiting}m, ${i.status})`)
        .join("\n")
    : "  - None";

  // Hot rooms with summaries
  const hotRoomLines = snapshot.hotRooms.length > 0
    ? snapshot.hotRooms
        .slice(0, 6)
        .map((r) => `  - Room ${r.roomNumber}: ${r.totalCount} requests, ${r.openCount} still open — [${r.summaries.join(" / ")}]`)
        .join("\n")
    : "  - No rooms with repeated requests";

  // Per-type resolution timing
  const timingByType = Object.entries(snapshot.avgResolutionByType)
    .map(([type, avg]) => `  - ${TYPE_LABELS[type] ?? type}: avg ${avg}m to resolve`)
    .join("\n") || "  - Not enough resolved data";

  // Resolved samples (for pattern context)
  const resolvedLines = snapshot.requestRows
    .filter((r) => r.status === "resolved")
    .slice(0, 8)
    .map((r) => `  - Room ${r.roomNumber} | ${TYPE_LABELS[r.requestType] ?? r.requestType}: "${r.summary}" (resolved in ${r.resolutionMinutes ?? "?"}m)`)
    .join("\n") || "  - None";

  return `You are a hotel operations manager's AI assistant. Generate a SHORT, SHARP, COMPLAINT-FOCUSED operational intelligence report.

CRITICAL FOCUS RULE: 80% of your analysis must focus on PROBLEMS — active complaints, repeated issues, rooms needing attention, unresolved friction, delays. The remaining 20% may address broader patterns.

=== CURRENT SITUATION ===
Total requests: ${snapshot.totalRequests}
UNRESOLVED: ${unresolved} (${snapshot.unresolverdRatio}% of total)
  - Open (not started): ${snapshot.byStatus.open}
  - In Progress (started): ${snapshot.byStatus.in_progress}
  - Resolved: ${snapshot.byStatus.resolved}

Support/Complaint requests: ${snapshot.complaintCount}

=== ACTIVE / UNRESOLVED ISSUES (oldest = most urgent) ===
${activeLines}

=== URGENT ISSUES (waiting ≥ 45 minutes) ===
${urgentLines}

=== ROOMS WITH REPEATED REQUESTS ===
${hotRoomLines}

=== TIMING BY CATEGORY ===
Overall avg resolution: ${snapshot.avgResolutionMinutes != null ? `${snapshot.avgResolutionMinutes}m` : "no resolved data"}
Per category:
${timingByType}
Longest active wait: ${snapshot.longestWaitingRequest ? `Room ${snapshot.longestWaitingRequest.roomNumber}, ${snapshot.longestWaitingRequest.minutesWaiting}m: "${snapshot.longestWaitingRequest.summary}"` : "None"}

=== RECENTLY RESOLVED (pattern context) ===
${resolvedLines}

=== INSTRUCTIONS ===
Respond ONLY with valid JSON in this EXACT format:
{
  "summary": ["bullet 1", "bullet 2"],
  "complaintAnalysis": ["complaint insight 1", "complaint insight 2", "complaint insight 3"],
  "timingInsights": ["timing insight 1", "timing insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Section rules:
- "summary": 2–3 bullets. High-signal overview. What is the current situation? What needs immediate attention?
- "complaintAnalysis": 3–5 bullets. MAIN SECTION — 80% of intelligence. Focus on: repeated issues, rooms generating repeated complaints, specific guest problems, stuck/delayed requests, complaint patterns. Name specific rooms and issues.
- "timingInsights": 2–3 bullets. Which request types are slow? Which are resolved fast? Which active issues have been waiting too long?
- "recommendations": 3–4 bullets. Concrete, manager-oriented, workload-reducing actions. What should the manager do RIGHT NOW?

Strict rules:
- Each bullet = max 1 sentence
- Use specific room numbers, guest names, request types, and durations from the data
- NO generic filler. Every bullet must reference real data.
- If there are no active issues, say so concisely in summary
- Do not invent data that is not provided`;
}

// ─── Daily Summary prompt builder ─────────────────────────────────────────────

function buildDailySummaryPrompt(snapshot: RequestAnalyticsSnapshot): string {
  const typeBreakdown = Object.entries(snapshot.byType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `  - ${TYPE_LABELS[type] ?? type}: ${count}`)
    .join("\n");

  const roomHotspots = snapshot.hotRooms.length > 0
    ? snapshot.hotRooms
        .slice(0, 5)
        .map((r) => `  - Room ${r.roomNumber}: ${r.totalCount} requests`)
        .join("\n")
    : "  - No rooms with repeated requests";

  const sampleIssues = snapshot.requestRows
    .slice(0, 12)
    .map((r) => `  - [${TYPE_LABELS[r.requestType] ?? r.requestType}] Room ${r.roomNumber} (${r.status}): "${r.summary}"`)
    .join("\n");

  return `You are a hotel operations analyst. Generate a SHORT daily summary of today's service requests for the hotel manager.

PERIOD: ${snapshot.periodStart.slice(0, 10)}
TOTAL REQUESTS: ${snapshot.totalRequests}
STATUS: Open: ${snapshot.byStatus.open} | In Progress: ${snapshot.byStatus.in_progress} | Resolved: ${snapshot.byStatus.resolved}
AVG RESOLUTION: ${snapshot.avgResolutionMinutes != null ? `${snapshot.avgResolutionMinutes}m` : "insufficient data"}

REQUEST TYPE BREAKDOWN:
${typeBreakdown}

ROOMS WITH HIGHEST ACTIVITY:
${roomHotspots}

SAMPLE REQUESTS:
${sampleIssues}

Respond ONLY with valid JSON:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}

Rules:
- insights: 3–5 bullets, concrete operational patterns from today's data
- recommendations: 3–4 bullets, practical manager-facing actions for tomorrow
- Each bullet = 1 sentence max
- No generic filler. Reference real patterns.`;
}

// ─── Quick Report AI generator ────────────────────────────────────────────────

export async function generateQuickReportAI(
  hotelId: number,
  snapshot: RequestAnalyticsSnapshot,
): Promise<QuickReportAIOutput & { aiUsage?: HotelAiUsageSnapshot; aiBudgetLimited?: boolean }> {
  if (snapshot.totalRequests === 0) {
    return {
      summary: ["No requests recorded today so far."],
      complaintAnalysis: ["No active issues to analyze."],
      timingInsights: ["No timing data available yet."],
      recommendations: ["No action required — check back when requests arrive."],
    };
  }

  const promptText = buildQuickReportPrompt(snapshot);
  const { value, usage, budgetLimited } = await runManagerGeminiJson({
    hotelId,
    feature: "quick_report",
    promptText,
    temperature: 0.25,
    fallback: QUICK_REPORT_FALLBACK,
    parse: (raw) => {
      const parsed = JSON.parse(raw) as Partial<QuickReportAIOutput>;
      return {
        summary: Array.isArray(parsed.summary) && parsed.summary.length > 0
          ? (parsed.summary as string[]).slice(0, 4)
          : QUICK_REPORT_FALLBACK.summary,
        complaintAnalysis:
          Array.isArray(parsed.complaintAnalysis) && parsed.complaintAnalysis.length > 0
            ? (parsed.complaintAnalysis as string[]).slice(0, 6)
            : QUICK_REPORT_FALLBACK.complaintAnalysis,
        timingInsights:
          Array.isArray(parsed.timingInsights) && parsed.timingInsights.length > 0
            ? (parsed.timingInsights as string[]).slice(0, 4)
            : QUICK_REPORT_FALLBACK.timingInsights,
        recommendations:
          Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
            ? (parsed.recommendations as string[]).slice(0, 5)
            : QUICK_REPORT_FALLBACK.recommendations,
      };
    },
  });

  return { ...value, aiUsage: usage, aiBudgetLimited: budgetLimited };
}

// ─── Daily Summary AI generator ───────────────────────────────────────────────

export async function generateAISummary(
  hotelId: number,
  snapshot: RequestAnalyticsSnapshot,
): Promise<AIInsightOutput & { aiUsage?: HotelAiUsageSnapshot; aiBudgetLimited?: boolean }> {
  if (snapshot.totalRequests === 0) {
    return {
      insights: ["No requests recorded for this period."],
      recommendations: ["No action required — check back when guest requests arrive."],
    };
  }

  const promptText = buildDailySummaryPrompt(snapshot);
  const { value, usage, budgetLimited } = await runManagerGeminiJson({
    hotelId,
    feature: "daily_summary",
    promptText,
    temperature: 0.3,
    fallback: DAILY_FALLBACK,
    parse: (raw) => {
      const parsed = JSON.parse(raw) as Partial<AIInsightOutput>;
      return {
        insights: Array.isArray(parsed.insights) && parsed.insights.length > 0
          ? (parsed.insights as string[]).slice(0, 6)
          : DAILY_FALLBACK.insights,
        recommendations:
          Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
            ? (parsed.recommendations as string[]).slice(0, 5)
            : DAILY_FALLBACK.recommendations,
      };
    },
  });

  return { ...value, aiUsage: usage, aiBudgetLimited: budgetLimited };
}

// ─── Task performance AI ──────────────────────────────────────────────────────

export interface TaskPerformanceEmployeeMetrics {
  name: string;
  assigned: number;
  completed: number;
  onTimeOrEarly: number;
  lateCompleted: number;
  overdueOpen: number;
  onTimeRate: number;
}

export interface TaskPerformanceAIOutput {
  summary: string;
  finishedOnTime: string[];
  finishedLate: string[];
  notFinished: string[];
  /** @deprecated Merged list for legacy clients */
  employeeNotes: string[];
}

export type TaskPerformanceInsightLocale = "en" | "tr" | "ar";

const TASK_PERF_FALLBACK: TaskPerformanceAIOutput = {
  summary: "Not enough completed tasks to analyze timing patterns yet.",
  finishedOnTime: [],
  finishedLate: [],
  notFinished: [],
  employeeNotes: [],
};

type EmployeeCategory = "finishedOnTime" | "finishedLate" | "notFinished";

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

function categorizeEmployee(e: TaskPerformanceEmployeeMetrics): EmployeeCategory | null {
  if (e.assigned === 0) return null;
  if (e.overdueOpen > 0 || e.completed < e.assigned) return "notFinished";
  if (e.lateCompleted > 0) return "finishedLate";
  if (e.onTimeOrEarly > 0 && e.completed > 0) return "finishedOnTime";
  return null;
}

function localeLanguageInstruction(locale: TaskPerformanceInsightLocale): string {
  switch (locale) {
    case "tr":
      return "Write ALL text in simple, everyday Turkish that a hotel manager reads in 10 seconds.";
    case "ar":
      return "Write ALL text in simple, clear Modern Standard Arabic.";
    default:
      return "Write ALL text in simple, everyday English that a hotel manager reads in 10 seconds.";
  }
}

function formatOnTimeLine(e: TaskPerformanceEmployeeMetrics, locale: TaskPerformanceInsightLocale): string {
  switch (locale) {
    case "tr":
      return `${e.name} — ${e.onTimeOrEarly}/${e.completed} görev zamanında veya erken bitti`;
    case "ar":
      return `${e.name} — ${e.onTimeOrEarly}/${e.completed} مهام في الوقت أو قبله`;
    default:
      return `${e.name} — ${e.onTimeOrEarly}/${e.completed} tasks finished on time or early`;
  }
}

function formatLateLine(e: TaskPerformanceEmployeeMetrics, locale: TaskPerformanceInsightLocale): string {
  switch (locale) {
    case "tr":
      return `${e.name} — ${e.lateCompleted} görev geç bitti`;
    case "ar":
      return `${e.name} — ${e.lateCompleted} مهام انتهت متأخرة`;
    default:
      return `${e.name} — ${e.lateCompleted} task(s) finished late`;
  }
}

function formatNotFinishedLine(
  e: TaskPerformanceEmployeeMetrics,
  locale: TaskPerformanceInsightLocale,
): string {
  const open = e.assigned - e.completed;
  switch (locale) {
    case "tr":
      if (e.overdueOpen > 0 && open > 0) {
        return `${e.name} — ${e.overdueOpen} gecikmiş, ${open} görev hâlâ açık`;
      }
      if (e.overdueOpen > 0) {
        return `${e.name} — ${e.overdueOpen} görev gecikmiş (bitmedi)`;
      }
      return `${e.name} — ${open} görev henüz bitmedi`;
    case "ar":
      if (e.overdueOpen > 0 && open > 0) {
        return `${e.name} — ${e.overdueOpen} متأخرة، ${open} مهام مفتوحة`;
      }
      if (e.overdueOpen > 0) {
        return `${e.name} — ${e.overdueOpen} مهام متأخرة (غير منجزة)`;
      }
      return `${e.name} — ${open} مهام لم تُنجز بعد`;
    default:
      if (e.overdueOpen > 0 && open > 0) {
        return `${e.name} — ${e.overdueOpen} overdue, ${open} still open`;
      }
      if (e.overdueOpen > 0) {
        return `${e.name} — ${e.overdueOpen} overdue (not finished)`;
      }
      return `${e.name} — ${open} task(s) not finished yet`;
  }
}

function formatSummaryLine(
  report: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  },
  locale: TaskPerformanceInsightLocale,
): string {
  switch (locale) {
    case "tr":
      return `Bugün ${report.totalTasks} görevden ${report.completedTasks} tamamlandı. ${report.overdueTasks} görev gecikmiş durumda.`;
    case "ar":
      return `${report.completedTasks} من ${report.totalTasks} مهام مكتملة. ${report.overdueTasks} مهام متأخرة.`;
    default:
      return `${report.completedTasks} of ${report.totalTasks} tasks completed. ${report.overdueTasks} still overdue.`;
  }
}

/** Deterministic insight from metrics — used as AI fallback and when budget is limited. */
export function buildDeterministicTaskInsight(
  report: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    employees: TaskPerformanceEmployeeMetrics[];
  },
  locale: TaskPerformanceInsightLocale = "en",
): TaskPerformanceAIOutput {
  if (report.totalTasks === 0) {
    const empty =
      locale === "tr"
        ? "Bu dönemde planlanmış görev yok."
        : locale === "ar"
          ? "لا مهام مجدولة في هذه الفترة."
          : "No tasks scheduled in this period.";
    return {
      summary: empty,
      finishedOnTime: [],
      finishedLate: [],
      notFinished: [],
      employeeNotes: [],
    };
  }

  const buckets = {
    finishedOnTime: [] as TaskPerformanceEmployeeMetrics[],
    finishedLate: [] as TaskPerformanceEmployeeMetrics[],
    notFinished: [] as TaskPerformanceEmployeeMetrics[],
  };

  for (const emp of sortByName(report.employees)) {
    const cat = categorizeEmployee(emp);
    if (cat) buckets[cat].push(emp);
  }

  const finishedOnTime = buckets.finishedOnTime.map((e) => formatOnTimeLine(e, locale));
  const finishedLate = buckets.finishedLate.map((e) => formatLateLine(e, locale));
  const notFinished = buckets.notFinished.map((e) => formatNotFinishedLine(e, locale));

  return {
    summary: formatSummaryLine(report, locale),
    finishedOnTime,
    finishedLate,
    notFinished,
    employeeNotes: [...finishedOnTime, ...finishedLate, ...notFinished],
  };
}

function buildTaskPerformancePrompt(
  report: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    employees: TaskPerformanceEmployeeMetrics[];
  },
  locale: TaskPerformanceInsightLocale,
): string {
  const deterministic = buildDeterministicTaskInsight(report, locale);

  const employeeDetailLines = sortByName(report.employees)
    .filter((e) => e.assigned > 0)
    .map(
      (e) =>
        `  • ${e.name}: assigned=${e.assigned}, completed=${e.completed}, on_time_or_early=${e.onTimeOrEarly}, late_completed=${e.lateCompleted}, overdue_open=${e.overdueOpen}, on_time_rate=${e.onTimeRate}%`,
    )
    .join("\n");

  const preSorted = [
    deterministic.finishedOnTime.length > 0
      ? `FINISHED ON TIME OR EARLY (A→Z):\n${deterministic.finishedOnTime.map((l) => `  - ${l}`).join("\n")}`
      : "FINISHED ON TIME OR EARLY: (none)",
    deterministic.finishedLate.length > 0
      ? `FINISHED LATE (A→Z):\n${deterministic.finishedLate.map((l) => `  - ${l}`).join("\n")}`
      : "FINISHED LATE: (none)",
    deterministic.notFinished.length > 0
      ? `NOT FINISHED / OVERDUE (A→Z):\n${deterministic.notFinished.map((l) => `  - ${l}`).join("\n")}`
      : "NOT FINISHED / OVERDUE: (none)",
  ].join("\n\n");

  return `You are a hotel operations assistant. Turn task performance data into a VERY SIMPLE brief for a department manager.

${localeLanguageInstruction(locale)}

PERIOD TOTALS:
- Total tasks: ${report.totalTasks}
- Completed: ${report.completedTasks} (${report.completionRate}% completion rate)
- Still overdue: ${report.overdueTasks}

RAW EMPLOYEE METRICS (on_time_or_early = finished by scheduled end or earlier):
${employeeDetailLines || "  (no employees)"}

PRE-SORTED GROUPS (use these names and categories — rewrite lines to be shorter and clearer, keep names EXACT):
${preSorted}

Respond ONLY with valid JSON:
{
  "summary": "One or two very short sentences with total numbers only",
  "finishedOnTime": ["Name — simple note", "..."],
  "finishedLate": ["Name — simple note", "..."],
  "notFinished": ["Name — simple note", "..."]
}

STRICT RULES:
- Use EXACT employee names from the data — never invent or shorten names
- finishedOnTime: employees who completed ALL assigned tasks on time or early (no late, no open overdue)
- finishedLate: employees who finished tasks but at least one was late (and nothing still overdue/open)
- notFinished: employees with overdue tasks OR incomplete/open tasks
- Each employee appears in AT MOST ONE list (worst status wins: notFinished > finishedLate > finishedOnTime)
- Sort each array A→Z by employee first name
- Each line: "Full Name — max 10 words, plain language"
- summary: max 2 short sentences, numbers only, no employee names
- If a category is empty, return []
- No markdown, no bullet symbols inside strings, no filler phrases`;
}

function normalizeTaskInsightOutput(
  parsed: Partial<TaskPerformanceAIOutput>,
  fallback: TaskPerformanceAIOutput,
): TaskPerformanceAIOutput {
  const finishedOnTime = Array.isArray(parsed.finishedOnTime)
    ? (parsed.finishedOnTime as string[]).filter((s) => typeof s === "string" && s.trim()).slice(0, 20)
    : fallback.finishedOnTime;
  const finishedLate = Array.isArray(parsed.finishedLate)
    ? (parsed.finishedLate as string[]).filter((s) => typeof s === "string" && s.trim()).slice(0, 20)
    : fallback.finishedLate;
  const notFinished = Array.isArray(parsed.notFinished)
    ? (parsed.notFinished as string[]).filter((s) => typeof s === "string" && s.trim()).slice(0, 20)
    : fallback.notFinished;

  return {
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : fallback.summary,
    finishedOnTime,
    finishedLate,
    notFinished,
    employeeNotes: [...finishedOnTime, ...finishedLate, ...notFinished],
  };
}

export async function generateTaskPerformanceAI(
  hotelId: number,
  report: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    employees: TaskPerformanceEmployeeMetrics[];
  },
  locale: TaskPerformanceInsightLocale = "en",
): Promise<TaskPerformanceAIOutput & { aiUsage?: HotelAiUsageSnapshot; aiBudgetLimited?: boolean }> {
  const deterministicFallback = buildDeterministicTaskInsight(report, locale);

  if (report.totalTasks === 0) {
    return { ...deterministicFallback };
  }

  const promptText = buildTaskPerformancePrompt(report, locale);
  const { value, usage, budgetLimited } = await runManagerGeminiJson({
    hotelId,
    feature: "task_report",
    promptText,
    temperature: 0.2,
    fallback: deterministicFallback,
    parse: (raw) => {
      const parsed = JSON.parse(raw) as Partial<TaskPerformanceAIOutput>;
      return normalizeTaskInsightOutput(parsed, deterministicFallback);
    },
  });

  if (budgetLimited) {
    return {
      summary:
        locale === "tr"
          ? "Aylık AI kotası doldu — platform yöneticisiyle iletişime geçin."
          : locale === "ar"
            ? "تم استنفاد حصة AI الشهرية — تواصل مع مسؤول المنصة."
            : "Monthly AI token budget reached — contact platform admin.",
      finishedOnTime: deterministicFallback.finishedOnTime,
      finishedLate: deterministicFallback.finishedLate,
      notFinished: deterministicFallback.notFinished,
      employeeNotes: deterministicFallback.employeeNotes,
      aiUsage: usage,
      aiBudgetLimited: true,
    };
  }

  return { ...value, aiUsage: usage, aiBudgetLimited: false };
}

/** Minimal-token daily summary — one sentence only; lists come from deterministic builder. */
export async function generateCompactTaskInsightSummary(
  hotelId: number,
  insight: TaskPerformanceAIOutput,
  locale: TaskPerformanceInsightLocale = "tr",
): Promise<string | null> {
  const onTimeNames = insight.finishedOnTime.map((l) => l.split(" — ")[0] ?? l).join(", ") || "—";
  const lateNames = insight.finishedLate.map((l) => l.split(" — ")[0] ?? l).join(", ") || "—";
  const openNames = insight.notFinished.map((l) => l.split(" — ")[0] ?? l).join(", ") || "—";

  const promptText = `${localeLanguageInstruction(locale)}

Task groups for today (names only):
- On time/early: ${onTimeNames}
- Finished late: ${lateNames}
- Not finished/overdue: ${openNames}

Write ONE short sentence (max 20 words) summarizing who did well vs who needs follow-up.
Respond ONLY with JSON: {"summary":"..."}`;

  const fallback = { summary: insight.summary };

  const { value, budgetLimited } = await runManagerGeminiJson({
    hotelId,
    feature: "task_report",
    promptText,
    temperature: 0.15,
    fallback,
    parse: (raw) => {
      const parsed = JSON.parse(raw) as { summary?: string };
      const text = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
      return { summary: text || insight.summary };
    },
  });

  if (budgetLimited) return null;
  return value.summary;
}
