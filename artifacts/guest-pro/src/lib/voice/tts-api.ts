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
/** Skip ElevenLabs after repeated hard failures (not transient 502). */
let premiumTtsDisabled = false;
let synthesizeFailureStreak = 0;
const STATUS_TTL_MS = 60_000;

export function getCachedTtsStatus(): TtsProviderStatus | null {
  return cachedStatus;
}

export function invalidateTtsStatusCache(): void {
  cachedStatus = null;
  statusFetchedAt = 0;
  premiumTtsDisabled = false;
  synthesizeFailureStreak = 0;
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

export function markPremiumTtsUnavailable(force = false): void {
  if (!force) {
    synthesizeFailureStreak += 1;
    if (synthesizeFailureStreak < 2) return;
  }
  premiumTtsDisabled = true;
  if (cachedStatus) {
    cachedStatus = { ...cachedStatus, available: false, fallback: true, remaining: 0 };
  }
}

export function markPremiumTtsSuccess(): void {
  synthesizeFailureStreak = 0;
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
      const retryable = status === 502 && attempt === 0;
      if (retryable) continue;
      if (isFallbackTtsError(err)) {
        markPremiumTtsUnavailable(true);
      } else {
        markPremiumTtsUnavailable();
      }
      return null;
    }
  }

  markPremiumTtsUnavailable();
  return null;
}
