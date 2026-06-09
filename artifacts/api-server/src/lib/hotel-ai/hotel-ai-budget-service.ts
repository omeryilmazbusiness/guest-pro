import {
  estimateRequestTokens,
  extractGeminiTokenUsage,
} from "./defaults";
import { hotelAiConfigRepository, hotelAiUsageRepository } from "./repositories";
import type {
  HotelAiBudgetCheck,
  HotelAiContext,
  HotelAiFeature,
  PlatformAiDefaults,
} from "./types";
import { HotelAiBudgetError } from "./types";

function resolveMaxOutput(
  feature: HotelAiFeature,
  config: HotelAiContext["config"],
  defaults: PlatformAiDefaults,
): number {
  switch (feature) {
    case "task_report":
      return config.maxOutputTokensTaskReport ?? defaults.defaultMaxOutputTaskReport;
    case "daily_summary":
      return config.maxOutputTokensDailySummary ?? defaults.defaultMaxOutputDailySummary;
    case "quick_report":
      return config.maxOutputTokensQuickReport ?? defaults.defaultMaxOutputQuickReport;
  }
}

function isFeatureEnabled(feature: HotelAiFeature, config: HotelAiContext["config"]): boolean {
  switch (feature) {
    case "task_report":
      return config.taskReportsEnabled;
    case "daily_summary":
      return config.dailySummariesEnabled;
    case "quick_report":
      return config.quickReportsEnabled;
  }
}

export class HotelAiBudgetService {
  async getContext(hotelId: number): Promise<HotelAiContext> {
    await hotelAiConfigRepository.ensureConfig(hotelId);
    const defaults = await hotelAiConfigRepository.getPlatformDefaults();
    const config =
      (await hotelAiConfigRepository.getConfig(hotelId)) ??
      ({
        hotelId,
        monthlyTokenBudget: null,
        maxOutputTokensTaskReport: null,
        maxOutputTokensDailySummary: null,
        maxOutputTokensQuickReport: null,
        taskReportsEnabled: true,
        dailySummariesEnabled: true,
        quickReportsEnabled: true,
      } satisfies HotelAiContext["config"]);

    const usage = await hotelAiUsageRepository.getUsage(hotelId);

    const effectiveMaxOutput: HotelAiContext["effectiveMaxOutput"] = {
      task_report: resolveMaxOutput("task_report", config, defaults),
      daily_summary: resolveMaxOutput("daily_summary", config, defaults),
      quick_report: resolveMaxOutput("quick_report", config, defaults),
    };

    const featureEnabled: HotelAiContext["featureEnabled"] = {
      task_report: config.taskReportsEnabled,
      daily_summary: config.dailySummariesEnabled,
      quick_report: config.quickReportsEnabled,
    };

    return { config, usage, effectiveMaxOutput, featureEnabled };
  }

  async checkBudget(
    hotelId: number,
    feature: HotelAiFeature,
    promptText: string,
  ): Promise<HotelAiBudgetCheck> {
    const context = await this.getContext(hotelId);
    if (!isFeatureEnabled(feature, context.config)) {
      return { allowed: false, reason: "feature_disabled", context };
    }

    const maxOut = context.effectiveMaxOutput[feature];
    const estimated = estimateRequestTokens(promptText, maxOut);
    if (context.usage.remainingTokens < estimated) {
      return { allowed: false, reason: "budget_exceeded", context };
    }

    return { allowed: true, context };
  }

  async assertCanRun(
    hotelId: number,
    feature: HotelAiFeature,
    promptText: string,
  ): Promise<HotelAiContext> {
    const check = await this.checkBudget(hotelId, feature, promptText);
    if (!check.allowed) {
      throw new HotelAiBudgetError(check.reason!, check.context);
    }
    return check.context;
  }

  async recordGeneration(
    hotelId: number,
    feature: HotelAiFeature,
    geminiResult: unknown,
    promptText: string,
    maxOutputTokens: number,
  ): Promise<number> {
    let tokens = extractGeminiTokenUsage(geminiResult);
    if (tokens <= 0) {
      tokens = estimateRequestTokens(promptText, Math.ceil(maxOutputTokens * 0.6));
    }
    await hotelAiUsageRepository.addUsage(hotelId, feature, tokens);
    return tokens;
  }

  /** Public snapshot for API responses (manager + platform). */
  async getUsageSnapshot(hotelId: number) {
    return hotelAiUsageRepository.getUsage(hotelId);
  }
}

export const hotelAiBudgetService = new HotelAiBudgetService();
