import { customFetch } from "@workspace/api-client-react";

export interface TtsProviderStatus {
  provider: "elevenlabs";
  configured?: boolean;
  available: boolean;
  /** When true, client should use browser speech synthesis. */
  fallback?: boolean;
  unavailableReason?: "MISSING_ENV" | "APP_QUOTA_EXCEEDED" | null;
  voiceId: string | null;
  voiceName: string;
  monthlyLimit: number;
  used: number;
  remaining: number;
  monthKey: string;
}

let cachedStatus: TtsProviderStatus | null = null;
let statusFetchedAt = 0;
/** Disabled only after synthesize failures in this session. */
let premiumTtsDisabled = false;
const STATUS_TTL_MS = 60_000;

export function getCachedTtsStatus(): TtsProviderStatus | null {
  return cachedStatus;
}

export function invalidateTtsStatusCache(): void {
  cachedStatus = null;
  statusFetchedAt = 0;
  premiumTtsDisabled = false;
}

function applyStatus(status: TtsProviderStatus): TtsProviderStatus {
  cachedStatus = status;
  statusFetchedAt = Date.now();
  if (status.available && status.remaining > 0) {
    premiumTtsDisabled = false;
  }
  return status;
}

export async function refreshTtsStatus(force = false): Promise<TtsProviderStatus | null> {
  const now = Date.now();
  if (!force && cachedStatus && now - statusFetchedAt < STATUS_TTL_MS) {
    return cachedStatus;
  }

  try {
    const status = await customFetch<TtsProviderStatus>("/api/tts/status");
    return applyStatus(status);
  } catch {
    return cachedStatus;
  }
}

/** True when we should attempt server-side ElevenLabs (not permanently disabled). */
export function shouldTryPremiumTts(): boolean {
  return !premiumTtsDisabled;
}

export function isElevenLabsTtsAvailable(): boolean {
  if (premiumTtsDisabled) return false;
  if (!cachedStatus) return true;
  return cachedStatus.available && cachedStatus.remaining > 0;
}

export function markPremiumTtsUnavailable(): void {
  premiumTtsDisabled = true;
  if (cachedStatus) {
    cachedStatus = { ...cachedStatus, available: false, fallback: true, remaining: 0 };
  }
}

export function markPremiumTtsSuccess(): void {
  premiumTtsDisabled = false;
}

type TtsErrorPayload = {
  code?: string;
  message?: string;
  fallback?: boolean;
  used?: number;
  monthlyLimit?: number;
  monthKey?: string;
};

function isFallbackTtsError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = "status" in err ? (err as { status: number }).status : 0;
  const data = "data" in err ? (err as { data: unknown }).data : null;
  const payload = data as TtsErrorPayload | null;
  return (
    payload?.fallback === true ||
    status === 429 ||
    status === 503 ||
    status === 502
  );
}

function errorStatus(err: unknown): number {
  if (!err || typeof err !== "object" || !("status" in err)) return 0;
  return (err as { status: number }).status;
}

export async function fetchElevenLabsAudio(text: string, lang: string): Promise<Blob | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const blob = await customFetch<Blob>("/api/tts/synthesize", {
        method: "POST",
        body: JSON.stringify({ text, lang }),
        responseType: "blob",
        headers: { Accept: "audio/mpeg" },
      });
      if (blob && blob.size > 0) {
        markPremiumTtsSuccess();
        return blob;
      }
    } catch (err) {
      const status = errorStatus(err);
      if (status === 502 && attempt === 0) continue;
      if (isFallbackTtsError(err)) {
        const payload =
          err && typeof err === "object" && "data" in err
            ? ((err as { data: unknown }).data as TtsErrorPayload | null)
            : null;
        if (import.meta.env.DEV && payload?.code) {
          console.warn("[TTS]", payload.code, payload.message ?? "");
        }
        markPremiumTtsUnavailable();
      }
      return null;
    }
  }

  markPremiumTtsUnavailable();
  return null;
}
