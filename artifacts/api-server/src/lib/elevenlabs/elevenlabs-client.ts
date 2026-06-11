import { elevenLabsConfig } from "./config";

export class ElevenLabsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly providerStatus?: string,
  ) {
    super(message);
    this.name = "ElevenLabsApiError";
  }
}

export function parseElevenLabsDetail(raw: string): {
  status?: string;
  message?: string;
} {
  if (!raw) return {};
  try {
    const json = JSON.parse(raw) as { detail?: { status?: string; message?: string } };
    return {
      status: json.detail?.status,
      message: json.detail?.message,
    };
  } catch {
    const status = raw.match(/"status"\s*:\s*"([^"]+)"/)?.[1];
    const message = raw.match(/"message"\s*:\s*"([^"]+)/)?.[1];
    return { status, message };
  }
}

export interface ElevenLabsSynthesisParams {
  text: string;
  voiceId: string;
  modelId: string;
  languageCode?: string;
}

const MODEL_FALLBACKS = [
  "eleven_multilingual_v2",
  "eleven_flash_v2_5",
  "eleven_turbo_v2_5",
] as const;

/** Free-tier friendly MP3; avoids Creator-tier bitrate requirements. */
const OUTPUT_FORMAT = "mp3_22050_32";

function modelCandidates(preferred: string): string[] {
  const ordered = [preferred, ...MODEL_FALLBACKS];
  return [...new Set(ordered.filter(Boolean))];
}

async function requestSpeech(
  params: ElevenLabsSynthesisParams,
  modelId: string,
): Promise<Buffer> {
  const apiKey = elevenLabsConfig.apiKey;
  if (!apiKey) {
    throw new ElevenLabsApiError("ElevenLabs is not configured", 503);
  }

  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(params.voiceId)}`,
  );
  url.searchParams.set("output_format", OUTPUT_FORMAT);

  const body: Record<string, unknown> = {
    text: params.text,
    model_id: modelId,
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.78,
      use_speaker_boost: true,
    },
  };

  if (params.languageCode) {
    body.language_code = params.languageCode;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const parsed = parseElevenLabsDetail(detail);
    throw new ElevenLabsApiError(
      detail.slice(0, 240) || `ElevenLabs TTS failed (${response.status})`,
      response.status,
      parsed.status,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new ElevenLabsApiError("ElevenLabs returned empty audio", 502);
  }

  return Buffer.from(arrayBuffer);
}

export async function synthesizeSpeech(params: ElevenLabsSynthesisParams): Promise<Buffer> {
  const models = modelCandidates(params.modelId);
  let lastError: ElevenLabsApiError | null = null;

  for (const modelId of models) {
    try {
      return await requestSpeech(params, modelId);
    } catch (err) {
      if (!(err instanceof ElevenLabsApiError)) throw err;
      lastError = err;
      // Auth / quota errors won't improve with another model.
      if (err.status === 401 || err.status === 403 || err.status === 402 || err.status === 429) {
        throw err;
      }
    }
  }

  throw lastError ?? new ElevenLabsApiError("ElevenLabs TTS failed", 502);
}
