/**
 * Wraps manager Gemini calls with per-hotel token budget enforcement.
 */

import { ai } from "@workspace/integrations-gemini-ai";
import { hotelAiBudgetService } from "./hotel-ai-budget-service";
import type { HotelAiFeature, HotelAiUsageSnapshot } from "./types";
import { HotelAiBudgetError } from "./types";

const MODEL = "gemini-2.5-flash";

export interface ManagerAiResult<T> {
  value: T;
  tokensUsed: number;
  usage: HotelAiUsageSnapshot;
  budgetLimited: boolean;
}

export async function runManagerGeminiJson<T>(opts: {
  hotelId: number;
  feature: HotelAiFeature;
  promptText: string;
  temperature: number;
  parse: (raw: string) => T;
  fallback: T;
}): Promise<ManagerAiResult<T>> {
  let context;
  try {
    context = await hotelAiBudgetService.assertCanRun(
      opts.hotelId,
      opts.feature,
      opts.promptText,
    );
  } catch (err) {
    if (err instanceof HotelAiBudgetError) {
      return {
        value: opts.fallback,
        tokensUsed: 0,
        usage: err.context.usage,
        budgetLimited: true,
      };
    }
    throw err;
  }

  const maxOutputTokens = context.effectiveMaxOutput[opts.feature];

  try {
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: opts.promptText }] }],
      config: {
        temperature: opts.temperature,
        maxOutputTokens,
        responseMimeType: "application/json",
      },
    });

    const tokensUsed = await hotelAiBudgetService.recordGeneration(
      opts.hotelId,
      opts.feature,
      result,
      opts.promptText,
      maxOutputTokens,
    );

    const raw = result.text?.trim() ?? "";
    const value = raw ? opts.parse(raw) : opts.fallback;
    const usage = await hotelAiBudgetService.getUsageSnapshot(opts.hotelId);

    return { value, tokensUsed, usage, budgetLimited: false };
  } catch {
    const usage = await hotelAiBudgetService.getUsageSnapshot(opts.hotelId);
    return { value: opts.fallback, tokensUsed: 0, usage, budgetLimited: false };
  }
}

export { HotelAiBudgetError };
