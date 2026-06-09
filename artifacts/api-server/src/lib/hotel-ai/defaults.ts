import type { HotelPlanTier } from "../hotel-provisioning";
import type { HotelAiFeature, PlatformAiDefaults } from "./types";

export const DEFAULT_PLATFORM_AI: PlatformAiDefaults = {
  defaultMonthlyTokenBudget: 100_000,
  starterMonthlyBudget: 50_000,
  growthMonthlyBudget: 200_000,
  enterpriseMonthlyBudget: 1_000_000,
  defaultMaxOutputTaskReport: 800,
  defaultMaxOutputDailySummary: 1024,
  defaultMaxOutputQuickReport: 1200,
};

export function currentPeriodKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function planTierMonthlyBudget(
  planTier: HotelPlanTier,
  defaults: PlatformAiDefaults,
): number {
  switch (planTier) {
    case "starter":
      return defaults.starterMonthlyBudget;
    case "growth":
      return defaults.growthMonthlyBudget;
    case "enterprise":
      return defaults.enterpriseMonthlyBudget;
  }
}

export function featureToMaxOutputField(feature: HotelAiFeature): keyof PlatformAiDefaults {
  switch (feature) {
    case "task_report":
      return "defaultMaxOutputTaskReport";
    case "daily_summary":
      return "defaultMaxOutputDailySummary";
    case "quick_report":
      return "defaultMaxOutputQuickReport";
  }
}

export function estimateRequestTokens(promptText: string, maxOutputTokens: number): number {
  const promptEstimate = Math.ceil(promptText.length / 4);
  return promptEstimate + maxOutputTokens;
}

export function extractGeminiTokenUsage(result: unknown): number {
  const meta = (result as { usageMetadata?: Record<string, number> })?.usageMetadata;
  if (!meta) return 0;
  if (typeof meta.totalTokenCount === "number" && meta.totalTokenCount > 0) {
    return meta.totalTokenCount;
  }
  const prompt = meta.promptTokenCount ?? 0;
  const candidates = meta.candidatesTokenCount ?? 0;
  return prompt + candidates;
}
