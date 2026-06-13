import { ai } from "@workspace/integrations-gemini-ai";
import {
  buildSystemPrompt,
  type ChatChannel,
  type ChatMode,
  type PromptBuildInput,
} from "./guided-prompts";
import {
  actionToCategory,
  parseAiResponse,
  type ChatRoadmap,
  type SuggestedChatAction,
} from "./chat-actions";
import {
  classifyGeminiError,
  extractFailedModel,
  GeminiAllModelsExhaustedError,
  GeminiChatError,
  getModelsToTry,
  isRetryableModelError,
  markModelCooldown,
  parseApiErrorPayload,
} from "./gemini-models";
import { logger } from "./logger";
import {
  buildFallbackCareInsights,
  buildRestaurantCarePrompt,
  dedupeCareProfilesByRoom,
  parseRestaurantCareInsights,
  type CareRequestSummary,
} from "./restaurant-care-analysis";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConciergeResponse {
  response: string;
  category: string;
  action: SuggestedChatAction | null;
  replyOptions: string[];
  roadmap: ChatRoadmap | null;
  model?: string;
}

function temperatureForMode(mode: ChatMode): number {
  if (mode === "food" || mode === "support" || mode === "care") return 0.45;
  return 0.55;
}

/** Lower caps = faster time-to-first-token; roadmaps need room for JSON stops. */
function maxTokensForChannel(channel: ChatChannel, roadmapRequested?: boolean): number {
  if (roadmapRequested) return channel === "voice" ? 520 : 1400;
  return channel === "voice" ? 220 : 420;
}

const CHAT_HISTORY_TURNS = 4;

type GenerateContentRequest = Omit<
  Parameters<typeof ai.models.generateContent>[0],
  "model"
>;

export async function generateContentWithModelFallback(
  request: GenerateContentRequest,
  lang?: string,
  opts?: { fastOnly?: boolean },
): Promise<{ text: string; model: string }> {
  let models = getModelsToTry({ fastOnly: opts?.fastOnly });
  if (models.length === 0) models = getModelsToTry();
  let lastErr: unknown;
  let maxRetryAfter: number | undefined;

  for (const model of models) {
    try {
      const result = await ai.models.generateContent({ ...request, model });
      const text = result.text?.trim();
      if (!text) {
        lastErr = new Error("Empty model response");
        markModelCooldown(model, 30);
        continue;
      }
      logger.debug({ model }, "gemini:model-success");
      return { text, model };
    } catch (err) {
      lastErr = err;
      const failedModel = extractFailedModel(err, model);
      if (isRetryableModelError(err)) {
        const info = parseApiErrorPayload(err);
        markModelCooldown(failedModel, info.retryAfterSec);
        if (info.retryAfterSec && (!maxRetryAfter || info.retryAfterSec > maxRetryAfter)) {
          maxRetryAfter = info.retryAfterSec;
        }
        logger.warn({ model: failedModel, retryAfterSec: info.retryAfterSec }, "gemini:model-skip");
        continue;
      }
      throw classifyGeminiError(err, lang);
    }
  }

  throw new GeminiAllModelsExhaustedError(maxRetryAfter, lastErr);
}

export async function generateConversationSummary(messages: ChatMessage[]): Promise<string> {
  if (messages.length === 0) return "";

  const historyText = messages
    .map((m) => `${m.role === "user" ? "Guest" : "Concierge"}: ${m.content}`)
    .join("\n");

  try {
    const { text } = await generateContentWithModelFallback({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Summarize this hotel guest conversation in 2-3 concise sentences. Focus on requests, decisions pending, and preferences:\n\n${historyText}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      });
    return text;
  } catch (err) {
    logger.warn({ err, messageCount: messages.length }, "conversation-summary-failed");
    return "";
  }
}

export async function generateConciergeResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  promptInput: Omit<PromptBuildInput, "mode" | "channel"> & {
    mode: ChatMode;
    channel: ChatChannel;
  },
): Promise<ConciergeResponse> {
  const systemNote = buildSystemPrompt(promptInput);

  const contents = conversationHistory.slice(-CHAT_HISTORY_TURNS).map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));

  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const lang = promptInput.detectedLanguage;
  const request: GenerateContentRequest = {
    contents,
    config: {
      systemInstruction: systemNote,
      temperature: temperatureForMode(promptInput.mode),
      maxOutputTokens: maxTokensForChannel(promptInput.channel, promptInput.roadmapRequested),
    },
  };

  let raw: string;
  let model: string | undefined;
  try {
    ({ text: raw, model } = await generateContentWithModelFallback(request, lang, { fastOnly: true }));
  } catch (err) {
    if (err instanceof GeminiAllModelsExhaustedError) {
      ({ text: raw, model } = await generateContentWithModelFallback(request, lang));
    } else {
      throw err;
    }
  }

  const { guestText, action, replyOptions, roadmap } = parseAiResponse(raw);

  return {
    response: guestText,
    category: actionToCategory(action),
    action,
    replyOptions,
    roadmap,
    model,
  };
}

export { GeminiAllModelsExhaustedError, GeminiChatError } from "./gemini-models";

// ---------------------------------------------------------------------------
// Restaurant care analysis
// ---------------------------------------------------------------------------

export { type CareRequestSummary } from "./restaurant-care-analysis";

export async function analyzeGuestCareForRestaurant(
  careRequests: CareRequestSummary[],
): Promise<string[]> {
  if (careRequests.length === 0) return [];

  const profiles = dedupeCareProfilesByRoom(careRequests);
  const prompt = buildRestaurantCarePrompt(profiles);

  try {
    const { text } = await generateContentWithModelFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.1, maxOutputTokens: 512 },
    });

    const parsed = parseRestaurantCareInsights(text.trim());
    if (parsed) return parsed;

    logger.warn(
      { careRequestCount: careRequests.length, profileCount: profiles.length },
      "analyzeGuestCareForRestaurant: invalid AI response, using fallback",
    );
    return buildFallbackCareInsights(profiles);
  } catch (err) {
    logger.error({ err, careRequestCount: careRequests.length }, "analyzeGuestCareForRestaurant failed");
    return buildFallbackCareInsights(profiles);
  }
}
