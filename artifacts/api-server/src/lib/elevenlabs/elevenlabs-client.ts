import { elevenLabsConfig } from "./config";

export class ElevenLabsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ElevenLabsApiError";
  }
}

export interface ElevenLabsSynthesisParams {
  text: string;
  voiceId: string;
  modelId: string;
}

export async function synthesizeSpeech(params: ElevenLabsSynthesisParams): Promise<Buffer> {
  const apiKey = elevenLabsConfig.apiKey;
  if (!apiKey) {
    throw new ElevenLabsApiError("ElevenLabs is not configured", 503);
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(params.voiceId)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: params.text,
      model_id: params.modelId,
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.78,
        style: 0.12,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ElevenLabsApiError(
      detail.slice(0, 240) || `ElevenLabs TTS failed (${response.status})`,
      response.status,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
