/**
 * ai-summary.ts
 * AI analysis pipeline for manager intelligence.
 * Takes a RequestAnalyticsSnapshot → produces operational insights + recommendations.
 * All prompt engineering lives here — isolated from routes and UI.
 */

import { ai } from "@workspace/integrations-gemini-ai";
import type { RequestAnalyticsSnapshot } from "./request-analytics";

// ─── Output type ─────────────────────────────────────────────────────────────

export interface AIInsightOutput {
  insights: string[];
  recommendations: string[];
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

const FALLBACK: AIInsightOutput = {
  insights: ["Not enough data to generate insights for this period."],
  recommendations: ["Continue monitoring request patterns over the coming days."],
};

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(snapshot: RequestAnalyticsSnapshot): string {
  const typeLabels: Record<string, string> = {
    FOOD_ORDER: "Food Orders",
    SUPPORT_REQUEST: "Support Requests",
    CARE_PROFILE_UPDATE: "Care Preferences",
    GENERAL_SERVICE_REQUEST: "General Service",
  };

  const typeBreakdown = Object.entries(snapshot.byType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `  - ${typeLabels[type] ?? type}: ${count}`)
    .join("\n");

  const roomHotspots =
    snapshot.topRooms.length > 0
      ? snapshot.topRooms
          .filter((r) => r.count > 1)
          .map((r) => `  - Room ${r.roomNumber}: ${r.count} requests`)
          .join("\n") || "  - No rooms with repeated requests"
      : "  - No room data available";

  const avgResolution = snapshot.avgResolutionMinutes != null
    ? `${snapshot.avgResolutionMinutes} minutes`
    : "not enough resolved data";

  const longestWait = snapshot.longestWaitingRequest
    ? `Request #${snapshot.longestWaitingRequest.id} in Room ${snapshot.longestWaitingRequest.roomNumber} has been waiting ${snapshot.longestWaitingRequest.minutesWaiting} minutes: "${snapshot.longestWaitingRequest.summary}"`
    : "None";

  const sampleIssues = snapshot.requestRows
    .slice(0, 12)
    .map((r) => `  - [${r.requestType}] Room ${r.roomNumber} (${r.status}): "${r.summary}"`)
    .join("\n");

  return `You are a hotel operations analyst. Analyze the following request data and provide SHORT, OPERATIONAL intelligence for the hotel manager.

PERIOD: ${snapshot.periodStart.slice(0, 10)} to ${snapshot.periodEnd.slice(0, 10)}
TOTAL REQUESTS: ${snapshot.totalRequests}
STATUS BREAKDOWN: Open: ${snapshot.byStatus.open} | In Progress: ${snapshot.byStatus.in_progress} | Resolved: ${snapshot.byStatus.resolved}
AVERAGE RESOLUTION TIME: ${avgResolution}
LONGEST WAITING ACTIVE REQUEST: ${longestWait}

REQUEST TYPE BREAKDOWN:
${typeBreakdown}

ROOMS WITH HIGHEST ACTIVITY:
${roomHotspots}

SAMPLE REQUEST SUMMARIES (for pattern detection):
${sampleIssues}

INSTRUCTIONS:
1. Generate 3–5 SHORT operational insights. Each must be concrete and specific to this data. No generic statements.
2. Generate 3–4 SHORT practical recommendations for the manager. Each must be actionable and relevant to the patterns observed.
3. Respond ONLY with valid JSON in this exact format:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}

Rules:
- Each bullet must be 1 sentence maximum
- Use specific numbers from the data whenever possible
- Do NOT produce generic filler text
- Focus on what is operationally useful RIGHT NOW`;
}

// ─── AI summary generator ─────────────────────────────────────────────────────

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
      contents: [{ role: "user", parts: [{ text: buildPrompt(snapshot) }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const raw = result.text?.trim() ?? "";

    const parsed = JSON.parse(raw) as Partial<AIInsightOutput>;
    const insights = Array.isArray(parsed.insights) && parsed.insights.length > 0
      ? (parsed.insights as string[]).slice(0, 6)
      : FALLBACK.insights;
    const recommendations = Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
      ? (parsed.recommendations as string[]).slice(0, 5)
      : FALLBACK.recommendations;

    return { insights, recommendations };
  } catch {
    return FALLBACK;
  }
}
