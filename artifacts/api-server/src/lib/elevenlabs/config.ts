import { optionalEnv, optionalInt } from "../env-helpers";

/** Sarah — warm multilingual voice (verified on free-tier key). */
export const DEFAULT_ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

function normalizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  return trimmed || undefined;
}

export const elevenLabsConfig = {
  get apiKey(): string | undefined {
    return normalizeApiKey(optionalEnv("ELEVENLABS_API_KEY"));
  },

  get voiceId(): string {
    return optionalEnv("ELEVENLABS_VOICE_ID", DEFAULT_ELEVENLABS_VOICE_ID)!.trim();
  },

  get modelId(): string {
    return optionalEnv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")!.trim();
  },

  /** App-enforced monthly character budget (independent of ElevenLabs dashboard). */
  get monthlyCharLimit(): number {
    return optionalInt("ELEVENLABS_MONTHLY_CHAR_LIMIT", 10_000);
  },

  /** Max characters per single synthesize request. */
  get maxCharsPerRequest(): number {
    return optionalInt("ELEVENLABS_MAX_CHARS_PER_REQUEST", 2_500);
  },

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  },
};
