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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConciergeResponse {
  response: string;
  category: string;
  action: SuggestedChatAction | null;
  replyOptions: string[];
  model?: string;
}

function temperatureForMode(mode: ChatMode): number {
  if (mode === "food" || mode === "support" || mode === "care") return 0.45;
  return 0.55;
}

/** Lower caps = faster time-to-first-token and total latency. */
function maxTokensForChannel(channel: ChatChannel): number {
  return channel === "voice" ? 220 : 420;
}

const CHAT_HISTORY_TURNS = 4;

type GenerateContentRequest = Omit<
  Parameters<typeof ai.models.generateContent>[0],
  "model"
>;

async function generateContentWithModelFallback(
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
      maxOutputTokens: maxTokensForChannel(promptInput.channel),
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

  const { guestText, action, replyOptions } = parseAiResponse(raw);

  return {
    response: guestText,
    category: actionToCategory(action),
    action,
    replyOptions,
    model,
  };
}

export { GeminiAllModelsExhaustedError, GeminiChatError } from "./gemini-models";

// ---------------------------------------------------------------------------
// Restaurant care analysis (unchanged)
// ---------------------------------------------------------------------------

export interface CareRequestSummary {
  roomNumber: string;
  guestName: string;
  summary: string;
  structuredData?: Record<string, unknown> | null;
}

export async function analyzeGuestCareForRestaurant(
  careRequests: CareRequestSummary[],
): Promise<string[]> {
  if (careRequests.length === 0) return [];

  const requestsText = careRequests
    .map(
      (r) =>
        `Oda ${r.roomNumber} (${r.guestName}): ${r.summary}${
          r.structuredData ? " | Detay: " + JSON.stringify(r.structuredData) : ""
        }`,
    )
    .join("\n");

  const prompt = `Sen 5 yıldızlı bir otel restoranının baş aşçısına yardım eden uzman bir beslenme danışmanısın.

Aşağıda otel misafirlerinin "Care About Me" profillerinden elde edilen veriler verilmiştir.
Bu profilleri derinlemesine analiz et ve restoran ekibine SOMUT, UYGULANABİLİR yemek hazırlama önerileri sun.

MİSAFİR PROFİLLERİ:
${requestsText}

SADECE JSON dizisi döndür, başka hiçbir metin ekleme:`;

  try {
    const { text } = await generateContentWithModelFallback({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.15, maxOutputTokens: 2048 },
    });

    const raw = text.trim() || "[]";
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch (err) {
    logger.error({ err, careRequestCount: careRequests.length }, "analyzeGuestCareForRestaurant failed");
    return [];
  }
}
