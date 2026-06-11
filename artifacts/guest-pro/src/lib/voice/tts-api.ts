import { customFetch } from "@workspace/api-client-react";

export interface TtsProviderStatus {
  provider: "elevenlabs";
  available: boolean;
  /** When true, client should use browser speech synthesis. */
  fallback?: boolean;
  voiceId: string | null;
  voiceName: string;
  monthlyLimit: number;
  used: number;
  remaining: number;
  monthKey: string;
}

let cachedStatus: TtsProviderStatus | null = null;
let statusFetchedAt = 0;
/** Skip ElevenLabs for the rest of the session once quota is exhausted or provider fails. */
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
  if (!status.available || status.fallback || status.remaining <= 0) {
    premiumTtsDisabled = true;
  }
  return status;
}

export async function refreshTtsStatus(force = false): Promise<TtsProviderStatus | null> {
  const now = Date.now();
  if (!force && cachedStatus && now - statusFetchedAt < STATUS_TTL_MS) {
    return cachedStatus;
  }

  if (premiumTtsDisabled && cachedStatus && !force) {
    return cachedStatus;
  }

  try {
    const status = await customFetch<TtsProviderStatus>("/api/tts/status");
    return applyStatus(status);
  } catch {
    premiumTtsDisabled = true;
    cachedStatus = {
      provider: "elevenlabs",
      available: false,
      fallback: true,
      voiceId: null,
      voiceName: "Sarah",
      monthlyLimit: 0,
      used: 0,
      remaining: 0,
      monthKey: "",
    };
    statusFetchedAt = now;
    return cachedStatus;
  }
}

export function isElevenLabsTtsAvailable(): boolean {
  if (premiumTtsDisabled) return false;
  return Boolean(cachedStatus?.available && cachedStatus.remaining > 0);
}

export function markPremiumTtsUnavailable(): void {
  premiumTtsDisabled = true;
  if (cachedStatus) {
    cachedStatus = { ...cachedStatus, available: false, fallback: true, remaining: 0 };
  }
}

type TtsErrorPayload = { code?: string; fallback?: boolean };

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

export async function fetchElevenLabsAudio(text: string, lang: string): Promise<Blob | null> {
  try {
    return await customFetch<Blob>("/api/tts/synthesize", {
      method: "POST",
      body: JSON.stringify({ text, lang }),
      responseType: "blob",
      headers: { Accept: "audio/mpeg" },
    });
  } catch (err) {
    if (isFallbackTtsError(err)) {
      markPremiumTtsUnavailable();
      return null;
    }
    markPremiumTtsUnavailable();
    return null;
  }
}
