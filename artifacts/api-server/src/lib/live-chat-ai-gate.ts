/**
 * Live-chat AI gate — respects hotel monthly token budget and Gemini capacity.
 * When unavailable, chat continues with original message text (no translation / insight).
 */
import { GeminiAllModelsExhaustedError } from "./gemini-models";

const PAUSE_MS = 5 * 60 * 1000;
const pausedUntilByHotel = new Map<number, number>();

function isPaused(hotelId: number): boolean {
  const until = pausedUntilByHotel.get(hotelId);
  if (!until) return false;
  if (Date.now() >= until) {
    pausedUntilByHotel.delete(hotelId);
    return false;
  }
  return true;
}

export function pauseLiveChatAi(hotelId: number, ms = PAUSE_MS): void {
  pausedUntilByHotel.set(hotelId, Date.now() + ms);
}

/** Test-only reset. */
export function resetLiveChatAiGate(): void {
  pausedUntilByHotel.clear();
}

export function isGeminiCapacityError(err: unknown): boolean {
  return err instanceof GeminiAllModelsExhaustedError;
}

/** True when live-chat may call Gemini (translation / staff insight). */
export async function canUseLiveChatAi(hotelId: number): Promise<boolean> {
  if (isPaused(hotelId)) return false;

  try {
    const { hotelAiBudgetService } = await import("./hotel-ai/hotel-ai-budget-service");
    const usage = await hotelAiBudgetService.getUsageSnapshot(hotelId);
    return usage.remainingTokens > 0;
  } catch {
    return true;
  }
}

/** Record token usage against the hotel monthly budget (counts toward total). */
export async function recordLiveChatAiUsage(
  hotelId: number,
  promptText: string,
  maxOutputTokens: number,
): Promise<void> {
  const { estimateRequestTokens } = await import("./hotel-ai/defaults");
  const { hotelAiUsageRepository } = await import("./hotel-ai/repositories");
  const tokens = estimateRequestTokens(promptText, Math.ceil(maxOutputTokens * 0.6));
  await hotelAiUsageRepository.addUsage(hotelId, "quick_report", tokens);
}
