/**
 * Gemini model registry, per-model cooldown after quota errors, and error types.
 *
 * Free-tier quotas are PER MODEL (not shared). Order: lite → flash, stable IDs first.
 * Override via GEMINI_CHAT_MODELS=comma,separated,list in .env
 */

/** Cooldown after 429/503 before retrying the same model (ms). */
const MODEL_COOLDOWN_MS = 90_000;

/** Fast path — tried first on every chat turn (min latency). */
const DEFAULT_FAST_CHAT_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
] as const;

/** Fallback if fast models are on cooldown / quota. */
const DEFAULT_FALLBACK_CHAT_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
] as const;

const DEFAULT_CHAT_MODELS = [
  ...DEFAULT_FAST_CHAT_MODELS,
  ...DEFAULT_FALLBACK_CHAT_MODELS,
] as const;

function parseEnvModelList(): string[] {
  const raw = process.env.GEMINI_CHAT_MODELS?.trim();
  if (!raw) return [...DEFAULT_CHAT_MODELS];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ordered fallback chain for chat (text generation). */
export const GEMINI_CHAT_MODELS: readonly string[] = parseEnvModelList();

export type GeminiFailureCode = "quota_exceeded" | "unavailable" | "invalid_key";

/** model → cooldown expiry timestamp */
const modelCooldownUntil = new Map<string, number>();

export function markModelCooldown(model: string, retryAfterSec?: number): void {
  const ms = retryAfterSec ? retryAfterSec * 1000 : MODEL_COOLDOWN_MS;
  modelCooldownUntil.set(model, Date.now() + ms);
}

export function getModelsToTry(opts?: { fastOnly?: boolean }): string[] {
  const now = Date.now();
  const pool = opts?.fastOnly
    ? GEMINI_CHAT_MODELS.filter((m) =>
        (DEFAULT_FAST_CHAT_MODELS as readonly string[]).includes(m),
      )
    : [...GEMINI_CHAT_MODELS];
  const available = pool.filter((m) => (modelCooldownUntil.get(m) ?? 0) <= now);
  if (available.length > 0) return available;
  return pool.length > 0 ? pool : [...GEMINI_CHAT_MODELS];
}

export function markAllModelsCooldown(retryAfterSec?: number): void {
  for (const model of GEMINI_CHAT_MODELS) {
    markModelCooldown(model, retryAfterSec);
  }
}

export class GeminiChatError extends Error {
  readonly code: GeminiFailureCode;
  readonly httpStatus: number;
  readonly guestMessage: string;
  readonly retryAfterSec?: number;

  constructor(
    code: GeminiFailureCode,
    guestMessage: string,
    httpStatus: number,
    cause?: unknown,
    retryAfterSec?: number,
  ) {
    super(cause instanceof Error ? cause.message : String(cause ?? guestMessage));
    this.name = "GeminiChatError";
    this.code = code;
    this.guestMessage = guestMessage;
    this.httpStatus = httpStatus;
    this.retryAfterSec = retryAfterSec;
  }
}

/** All models in the chain failed (quota / unavailable). */
export class GeminiAllModelsExhaustedError extends Error {
  readonly code = "all_models_exhausted" as const;
  readonly retryAfterSec?: number;

  constructor(retryAfterSec?: number, cause?: unknown) {
    super(cause instanceof Error ? cause.message : "All Gemini models exhausted");
    this.name = "GeminiAllModelsExhaustedError";
    this.retryAfterSec = retryAfterSec;
  }
}

export function parseApiErrorPayload(err: unknown): {
  code?: number;
  message?: string;
  retryAfterSec?: number;
  model?: string;
} {
  const raw = err instanceof Error ? err.message : String(err);
  let model: string | undefined;
  const modelMatch = raw.match(/model:\s*([\w.-]+)/i);
  if (modelMatch?.[1]) model = modelMatch[1];

  try {
    const parsed = JSON.parse(raw) as {
      error?: { code?: number; message?: string; details?: unknown[] };
    };
    const retryDetail = parsed.error?.details?.find(
      (d) => d && typeof d === "object" && "@type" in d && String(d["@type"]).includes("RetryInfo"),
    ) as { retryDelay?: string } | undefined;
    let retryAfterSec: number | undefined;
    if (retryDetail?.retryDelay) {
      const sec = parseFloat(retryDetail.retryDelay.replace(/s$/, ""));
      if (!Number.isNaN(sec)) retryAfterSec = Math.ceil(sec);
    }
    const quotaDetail = parsed.error?.details?.find(
      (d) =>
        d &&
        typeof d === "object" &&
        "violations" in d &&
        Array.isArray((d as { violations?: { quotaDimensions?: { model?: string } }[] }).violations),
    ) as { violations?: { quotaDimensions?: { model?: string } }[] } | undefined;
    const violatedModel = quotaDetail?.violations?.[0]?.quotaDimensions?.model;
    if (violatedModel) model = violatedModel;

    return {
      code: parsed.error?.code,
      message: parsed.error?.message,
      retryAfterSec,
      model,
    };
  } catch {
    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
      return { code: 429, message: raw, model };
    }
    if (raw.includes("API key") || raw.includes("API_KEY")) {
      return { code: 401, message: raw };
    }
    return { message: raw, model };
  }
}

export function guestAiErrorMessage(
  lang: string | undefined,
  code: GeminiFailureCode,
): string {
  const l = (lang ?? "en").toLowerCase();
  if (code === "quota_exceeded") {
    if (l.startsWith("tr")) {
      return "Yapay zeka asistanı şu an yoğun. Lütfen bir dakika sonra tekrar deneyin veya resepsiyonu arayın.";
    }
    if (l.startsWith("ar")) {
      return "مساعد الذكاء الاصطناعي مشغول حالياً. يرجى المحاولة بعد دقيقة أو الاتصال بالاستقبال.";
    }
    if (l.startsWith("ru")) {
      return "ИИ-ассистент сейчас занят. Повторите попытку через минуту или позвоните на ресепшен.";
    }
    if (l.startsWith("de")) {
      return "Der KI-Assistent ist gerade ausgelastet. Bitte versuchen Sie es in einer Minute erneut.";
    }
    if (l.startsWith("fr")) {
      return "Le concierge IA est occupé. Réessayez dans une minute ou appelez la réception.";
    }
    if (l.startsWith("es")) {
      return "El conserje IA está ocupado. Inténtelo de nuevo en un minuto o llame a recepción.";
    }
    return "The AI concierge is busy right now. Please try again in a minute or call reception.";
  }
  if (code === "invalid_key") {
    if (l.startsWith("tr")) {
      return "Asistan geçici olarak kullanılamıyor. Lütfen resepsiyonla iletişime geçin.";
    }
    if (l.startsWith("ar")) {
      return "المساعد غير متاح مؤقتاً. يرجى الاتصال بالاستقبال.";
    }
    if (l.startsWith("ru")) {
      return "Ассистент временно недоступен. Обратитесь на ресепшен.";
    }
    if (l.startsWith("de")) {
      return "Der Assistent ist vorübergehend nicht verfügbar. Bitte kontaktieren Sie die Rezeption.";
    }
    if (l.startsWith("fr")) {
      return "L'assistant est temporairement indisponible. Contactez la réception.";
    }
    if (l.startsWith("es")) {
      return "El asistente no está disponible temporalmente. Contacte con recepción.";
    }
    return "The assistant is temporarily unavailable. Please contact reception.";
  }
  if (l.startsWith("tr")) {
    return "Asistan şu an yanıt veremiyor. Lütfen tekrar deneyin.";
  }
  if (l.startsWith("ar")) {
    return "المساعد لا يستطيع الرد حالياً. يرجى المحاولة مرة أخرى.";
  }
  if (l.startsWith("ru")) {
    return "Ассистент не может ответить. Попробуйте снова.";
  }
  if (l.startsWith("de")) {
    return "Der Assistent kann gerade nicht antworten. Bitte erneut versuchen.";
  }
  if (l.startsWith("fr")) {
    return "L'assistant ne peut pas répondre. Veuillez réessayer.";
  }
  if (l.startsWith("es")) {
    return "El asistente no puede responder. Inténtelo de nuevo.";
  }
  return "The assistant could not respond. Please try again.";
}

export function classifyGeminiError(err: unknown, lang?: string): GeminiChatError {
  const { code, retryAfterSec } = parseApiErrorPayload(err);
  if (code === 429) {
    return new GeminiChatError(
      "quota_exceeded",
      guestAiErrorMessage(lang, "quota_exceeded"),
      503,
      err,
      retryAfterSec,
    );
  }
  if (code === 401 || code === 403) {
    return new GeminiChatError(
      "invalid_key",
      guestAiErrorMessage(lang, "invalid_key"),
      503,
      err,
    );
  }
  return new GeminiChatError(
    "unavailable",
    guestAiErrorMessage(lang, "unavailable"),
    503,
    err,
  );
}

/** Try the next model in the fallback chain. */
export function isRetryableModelError(err: unknown): boolean {
  const { code, message } = parseApiErrorPayload(err);
  if (code === 429 || code === 503) return true;
  const msg = message ?? "";
  return (
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("high demand") ||
    msg.includes("UNAVAILABLE")
  );
}

export function extractFailedModel(err: unknown, attemptedModel: string): string {
  return parseApiErrorPayload(err).model ?? attemptedModel;
}
