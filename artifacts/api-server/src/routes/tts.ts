import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireGuest } from "../middlewares/requireAuth";
import {
  elevenLabsTtsService,
  TtsQuotaExceededError,
} from "../lib/elevenlabs/elevenlabs-tts-service";
import { ElevenLabsApiError } from "../lib/elevenlabs/elevenlabs-client";
import { elevenLabsConfig } from "../lib/elevenlabs/config";
import { logger } from "../lib/logger";

function monthKeyUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function degradedTtsStatus() {
  return {
    provider: "elevenlabs" as const,
    available: false,
    fallback: true,
    voiceId: elevenLabsConfig.isConfigured ? elevenLabsConfig.voiceId : null,
    voiceName: "Sarah",
    monthlyLimit: elevenLabsConfig.monthlyCharLimit,
    used: 0,
    remaining: 0,
    monthKey: monthKeyUtc(),
  };
}

const router: IRouter = Router();

const synthesizeBodySchema = z.object({
  text: z.string().min(1).max(5000),
  lang: z.string().optional(),
});

/** GET /api/tts/status — ElevenLabs availability + app monthly quota */
router.get("/tts/status", requireGuest, async (_req, res): Promise<void> => {
  if (!elevenLabsConfig.isConfigured) {
    res.json(degradedTtsStatus());
    return;
  }

  try {
    const status = await elevenLabsTtsService.getStatus();
    const available = status.enabled && status.remaining > 0;
    res.json({
      provider: "elevenlabs",
      available,
      fallback: !available,
      voiceId: status.voiceId,
      voiceName: status.voiceName,
      monthlyLimit: status.monthlyLimit,
      used: status.used,
      remaining: status.remaining,
      monthKey: status.monthKey,
    });
  } catch (err) {
    logger.warn({ err }, "tts:status-degraded");
    res.json(degradedTtsStatus());
  }
});

/** POST /api/tts/synthesize — returns MPEG audio for guest voice chat */
router.post("/tts/synthesize", requireGuest, async (req, res): Promise<void> => {
  if (!elevenLabsConfig.isConfigured) {
    res.status(503).json({ code: "NOT_CONFIGURED", fallback: true });
    return;
  }

  const parsed = synthesizeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const { audio, charsUsed } = await elevenLabsTtsService.synthesize(
      parsed.data.text,
      parsed.data.lang,
    );
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-TTS-Chars-Used", String(charsUsed));
    res.send(audio);
  } catch (err) {
    if (err instanceof TtsQuotaExceededError) {
      res.status(429).json({ code: "QUOTA_EXCEEDED", fallback: true });
      return;
    }

    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Empty text after sanitization")) {
      res.status(400).json({ code: "EMPTY_TEXT", fallback: true });
      return;
    }

    if (err instanceof ElevenLabsApiError) {
      if (err.status === 401 || err.status === 403) {
        logger.warn({ status: err.status, detail: err.message }, "tts:invalid-api-key");
        res.status(503).json({ code: "NOT_CONFIGURED", fallback: true });
        return;
      }
      if (err.status === 402 || err.status === 429) {
        res.status(429).json({ code: "QUOTA_EXCEEDED", fallback: true });
        return;
      }
      logger.warn({ status: err.status, detail: err.message }, "tts:synthesize-provider-error");
      res.status(502).json({ code: "PROVIDER_ERROR", fallback: true });
      return;
    }

    logger.warn({ err }, "tts:synthesize-failed");
    res.status(502).json({ code: "PROVIDER_ERROR", fallback: true });
  }
});

export default router;
