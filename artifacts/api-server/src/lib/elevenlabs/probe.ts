import { elevenLabsConfig, DEFAULT_ELEVENLABS_VOICE_ID } from "./config";
import { synthesizeSpeech, ElevenLabsApiError } from "./elevenlabs-client";
import { logger } from "../logger";

export type ElevenLabsTtsProbeResult = {
  ok: boolean;
  status: string;
  httpStatus?: number;
  keyLength: number;
  checkedAt: string;
};

let cachedProbe: ElevenLabsTtsProbeResult | null = null;
let probeInFlight: Promise<ElevenLabsTtsProbeResult> | null = null;

function parseProviderStatus(message: string): string {
  try {
    const json = JSON.parse(message) as { detail?: { status?: string; message?: string } };
    return json.detail?.status ?? json.detail?.message ?? message;
  } catch {
    return message.slice(0, 120);
  }
}

/** Minimal paid TTS call — verifies the key works for text-to-speech (not /v1/user). */
export async function probeElevenLabsTts(): Promise<ElevenLabsTtsProbeResult> {
  const key = elevenLabsConfig.apiKey;
  const checkedAt = new Date().toISOString();

  if (!key) {
    return { ok: false, status: "missing_env", keyLength: 0, checkedAt };
  }

  try {
    const audio = await synthesizeSpeech({
      text: "Hi",
      voiceId: elevenLabsConfig.voiceId || DEFAULT_ELEVENLABS_VOICE_ID,
      modelId: "eleven_flash_v2_5",
    });
    if (audio.byteLength === 0) {
      return { ok: false, status: "empty_audio", keyLength: key.length, checkedAt };
    }
    return { ok: true, status: "ok", keyLength: key.length, checkedAt };
  } catch (err) {
    if (err instanceof ElevenLabsApiError) {
      const status = parseProviderStatus(err.message);
      logger.warn(
        { httpStatus: err.status, providerStatus: status, keyLength: key.length },
        "elevenlabs:tts-probe-failed",
      );
      return {
        ok: false,
        status,
        httpStatus: err.status,
        keyLength: key.length,
        checkedAt,
      };
    }
    logger.warn({ err, keyLength: key.length }, "elevenlabs:tts-probe-error");
    return { ok: false, status: "probe_error", keyLength: key.length, checkedAt };
  }
}

export async function getElevenLabsTtsProbe(refresh = false): Promise<ElevenLabsTtsProbeResult> {
  const stale =
    cachedProbe &&
    Date.now() - new Date(cachedProbe.checkedAt).getTime() > 10 * 60_000;

  if (!refresh && cachedProbe && !stale) {
    return cachedProbe;
  }

  if (!probeInFlight) {
    probeInFlight = probeElevenLabsTts().finally(() => {
      probeInFlight = null;
    });
  }

  cachedProbe = await probeInFlight;
  return cachedProbe;
}

export function resetElevenLabsProbeForTests(): void {
  cachedProbe = null;
  probeInFlight = null;
}
