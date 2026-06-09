/** Manager AI feature keys tracked for token budgets. */
export type HotelAiFeature = "task_report" | "daily_summary" | "quick_report";

export interface PlatformAiDefaults {
  defaultMonthlyTokenBudget: number;
  starterMonthlyBudget: number;
  growthMonthlyBudget: number;
  enterpriseMonthlyBudget: number;
  defaultMaxOutputTaskReport: number;
  defaultMaxOutputDailySummary: number;
  defaultMaxOutputQuickReport: number;
}

export interface HotelAiConfigDto {
  hotelId: number;
  monthlyTokenBudget: number | null;
  maxOutputTokensTaskReport: number | null;
  maxOutputTokensDailySummary: number | null;
  maxOutputTokensQuickReport: number | null;
  taskReportsEnabled: boolean;
  dailySummariesEnabled: boolean;
  quickReportsEnabled: boolean;
}

export interface HotelAiUsageSnapshot {
  periodKey: string;
  tokensUsed: number;
  requestCount: number;
  monthlyBudget: number;
  remainingTokens: number;
  usagePercent: number;
  byFeature: {
    taskReport: number;
    dailySummary: number;
    quickReport: number;
  };
}

export interface HotelAiContext {
  config: HotelAiConfigDto;
  usage: HotelAiUsageSnapshot;
  effectiveMaxOutput: Record<HotelAiFeature, number>;
  featureEnabled: Record<HotelAiFeature, boolean>;
}

export interface HotelAiBudgetCheck {
  allowed: boolean;
  reason?: "budget_exceeded" | "feature_disabled";
  context: HotelAiContext;
}

export class HotelAiBudgetError extends Error {
  readonly code: "budget_exceeded" | "feature_disabled";
  readonly context: HotelAiContext;

  constructor(code: "budget_exceeded" | "feature_disabled", context: HotelAiContext) {
    super(code === "budget_exceeded" ? "Monthly AI token budget exceeded" : "AI feature disabled");
    this.name = "HotelAiBudgetError";
    this.code = code;
    this.context = context;
  }
}
