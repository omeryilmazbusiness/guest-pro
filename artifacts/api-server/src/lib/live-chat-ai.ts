import { generateContentWithModelFallback } from "./gemini";
import { GeminiAllModelsExhaustedError } from "./gemini-models";
import { logger } from "./logger";
import {
  buildLiveChatAutoDetectTranslationPrompt,
  buildLiveChatStaffInsightPrompt,
  buildLiveChatTranslationPrompt,
  langBase,
} from "./live-chat-translate-lang";
import {
  canUseLiveChatAi,
  isGeminiCapacityError,
  pauseLiveChatAi,
  recordLiveChatAiUsage,
} from "./live-chat-ai-gate";

export interface GuestMessageAnalysis {
  translatedContent: string;
  aiInsight: string | null;
}

const TRANSLATE_MAX_TOKENS = 512;
const INSIGHT_MAX_TOKENS = 160;

export async function translateText(
  text: string,
  toLang: string,
  fromLang?: string | null,
  hotelId?: number,
): Promise<string> {
  if (!text.trim()) return text;

  const target = langBase(toLang);
  const source = fromLang ? langBase(fromLang) : null;

  if (source && source === target) return text;

  if (hotelId != null && !(await canUseLiveChatAi(hotelId))) {
    return text;
  }

  const prompt =
    source && source !== target
      ? buildLiveChatTranslationPrompt(text, source, target)
      : buildLiveChatAutoDetectTranslationPrompt(text, target);

  try {
    const { text: result } = await generateContentWithModelFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.05, maxOutputTokens: TRANSLATE_MAX_TOKENS },
    });
    if (hotelId != null) {
      await recordLiveChatAiUsage(hotelId, prompt, TRANSLATE_MAX_TOKENS);
    }
    const translated = result.trim();
    return translated.length > 0 ? translated : text;
  } catch (err) {
    if (hotelId != null && isGeminiCapacityError(err)) {
      pauseLiveChatAi(hotelId);
    }
    logger.warn({ err, fromLang: source, toLang: target }, "live-chat translate failed");
    return text;
  }
}

export async function analyzeGuestMessageForStaff(
  guestText: string,
  staffLang: string,
  hotelId?: number,
): Promise<GuestMessageAnalysis> {
  if (hotelId != null && !(await canUseLiveChatAi(hotelId))) {
    return { translatedContent: guestText, aiInsight: null };
  }

  const translatedContent = await translateText(guestText, staffLang, null, hotelId);

  if (hotelId != null && !(await canUseLiveChatAi(hotelId))) {
    return { translatedContent, aiInsight: null };
  }

  const prompt = buildLiveChatStaffInsightPrompt(
    guestText,
    "auto",
    staffLang,
    translatedContent,
  );

  try {
    const { text } = await generateContentWithModelFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1, maxOutputTokens: INSIGHT_MAX_TOKENS },
    });
    if (hotelId != null) {
      await recordLiveChatAiUsage(hotelId, prompt, INSIGHT_MAX_TOKENS);
    }
    const aiInsight = text.trim().slice(0, 160);
    return {
      translatedContent,
      aiInsight: aiInsight.length > 0 ? aiInsight : null,
    };
  } catch (err) {
    if (hotelId != null && isGeminiCapacityError(err)) {
      pauseLiveChatAi(hotelId);
    }
    logger.warn({ err }, "live-chat guest insight failed");
    return {
      translatedContent,
      aiInsight: null,
    };
  }
}

export async function translateStaffMessageForGuest(
  staffText: string,
  guestLang: string,
  hotelId?: number,
): Promise<string> {
  return translateText(staffText, guestLang, null, hotelId);
}

export { GeminiAllModelsExhaustedError, isGeminiCapacityError };
