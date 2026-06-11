import { elevenLabsConfig } from "./config";
import { synthesizeSpeech } from "./elevenlabs-client";
import { ElevenLabsQuotaStore } from "./quota-store";
import { sanitizeTextForTts } from "./text-sanitize";

function toLanguageCode(lang?: string): string | undefined {
  if (!lang?.trim()) return undefined;
  const base = lang.trim().split("-")[0]?.toLowerCase();
  return base && base.length === 2 ? base : undefined;
}

export type TtsProviderStatus = {
  enabled: boolean;
  voiceId: string | null;
  voiceName: string;
  monthlyLimit: number;
  used: number;
  remaining: number;
  monthKey: string;
};

export class TtsQuotaExceededError extends Error {
  readonly code = "QUOTA_EXCEEDED" as const;
  constructor() {
    super("Monthly ElevenLabs character quota exceeded");
    this.name = "TtsQuotaExceededError";
  }
}

export class ElevenLabsTtsService {
  private readonly quota: ElevenLabsQuotaStore;

  constructor() {
    this.quota = new ElevenLabsQuotaStore(elevenLabsConfig.monthlyCharLimit);
  }

  async getStatus(): Promise<TtsProviderStatus> {
    const snap = await this.quota.getSnapshot();
    const enabled = elevenLabsConfig.isConfigured;
    return {
      enabled,
      voiceId: enabled ? elevenLabsConfig.voiceId : null,
      voiceName: "Sarah",
      monthlyLimit: snap.limit,
      used: snap.used,
      remaining: enabled ? snap.remaining : 0,
      monthKey: snap.monthKey,
    };
  }

  async synthesize(
    rawText: string,
    lang?: string,
  ): Promise<{ audio: Buffer; charsUsed: number }> {
    if (!elevenLabsConfig.isConfigured) {
      throw new Error("ElevenLabs is not configured");
    }

    const text = sanitizeTextForTts(rawText, elevenLabsConfig.maxCharsPerRequest);
    if (!text) {
      throw new Error("Empty text after sanitization");
    }

    const chars = text.length;
    const allowed = await this.quota.tryConsume(chars);
    if (!allowed) {
      throw new TtsQuotaExceededError();
    }

    try {
      const audio = await synthesizeSpeech({
        text,
        voiceId: elevenLabsConfig.voiceId,
        modelId: elevenLabsConfig.modelId,
        languageCode: toLanguageCode(lang),
      });
      return { audio, charsUsed: chars };
    } catch (err) {
      await this.quota.release(chars);
      throw err;
    }
  }
}

export const elevenLabsTtsService = new ElevenLabsTtsService();
