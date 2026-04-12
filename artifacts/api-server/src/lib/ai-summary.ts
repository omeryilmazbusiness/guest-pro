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

import { ai } from "@workspace/integrations-gemini-ai";
import type { RequestAnalyticsSnapshot } from "./request-analytics";

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
  snapshot: RequestAnalyticsSnapshot
): Promise<QuickReportAIOutput> {
  if (snapshot.totalRequests === 0) {
    return {
      summary: ["No requests recorded today so far."],
      complaintAnalysis: ["No active issues to analyze."],
      timingInsights: ["No timing data available yet."],
      recommendations: ["No action required — check back when requests arrive."],
    };
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: buildQuickReportPrompt(snapshot) }] }],
      config: {
        temperature: 0.25,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
      },
    });

    const raw = result.text?.trim() ?? "";
    const parsed = JSON.parse(raw) as Partial<QuickReportAIOutput>;

    return {
      summary: Array.isArray(parsed.summary) && parsed.summary.length > 0
        ? (parsed.summary as string[]).slice(0, 4)
        : QUICK_REPORT_FALLBACK.summary,
      complaintAnalysis: Array.isArray(parsed.complaintAnalysis) && parsed.complaintAnalysis.length > 0
        ? (parsed.complaintAnalysis as string[]).slice(0, 6)
        : QUICK_REPORT_FALLBACK.complaintAnalysis,
      timingInsights: Array.isArray(parsed.timingInsights) && parsed.timingInsights.length > 0
        ? (parsed.timingInsights as string[]).slice(0, 4)
        : QUICK_REPORT_FALLBACK.timingInsights,
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
        ? (parsed.recommendations as string[]).slice(0, 5)
        : QUICK_REPORT_FALLBACK.recommendations,
    };
  } catch {
    return QUICK_REPORT_FALLBACK;
  }
}

// ─── Daily Summary AI generator ───────────────────────────────────────────────

export async function generateAISummary(
  snapshot: RequestAnalyticsSnapshot
): Promise<AIInsightOutput> {
  if (snapshot.totalRequests === 0) {
    return {
      insights: ["No requests recorded for this period."],
      recommendations: ["No action required — check back when guest requests arrive."],
    };
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: buildDailySummaryPrompt(snapshot) }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const raw = result.text?.trim() ?? "";
    const parsed = JSON.parse(raw) as Partial<AIInsightOutput>;

    return {
      insights: Array.isArray(parsed.insights) && parsed.insights.length > 0
        ? (parsed.insights as string[]).slice(0, 6)
        : DAILY_FALLBACK.insights,
      recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
        ? (parsed.recommendations as string[]).slice(0, 5)
        : DAILY_FALLBACK.recommendations,
    };
  } catch {
    return DAILY_FALLBACK;
  }
}
