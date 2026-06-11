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

type TtsUnavailableReason =
  | "MISSING_ENV"
  | "APP_QUOTA_EXCEEDED"
  | null;

function degradedTtsStatus(reason: TtsUnavailableReason = null) {
  const configured = elevenLabsConfig.isConfigured;
  return {
    provider: "elevenlabs" as const,
    configured,
    available: false,
    fallback: true,
    unavailableReason: reason ?? (configured ? null : "MISSING_ENV"),
    voiceId: configured ? elevenLabsConfig.voiceId : null,
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
    res.json(degradedTtsStatus("MISSING_ENV"));
    return;
  }

  try {
    const status = await elevenLabsTtsService.getStatus();
    const available = status.enabled && status.remaining > 0;
    res.json({
      provider: "elevenlabs",
      configured: true,
      available,
      fallback: !available,
      unavailableReason: !available && status.remaining <= 0 ? "APP_QUOTA_EXCEEDED" : null,
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
    logger.warn("tts:synthesize-missing-env — set ELEVENLABS_API_KEY on the server");
    res.status(503).json({
      code: "MISSING_ENV",
      message: "ELEVENLABS_API_KEY is not set on the server",
      fallback: true,
    });
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
    logger.info({ charsUsed }, "tts:synthesize-ok");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-TTS-Chars-Used", String(charsUsed));
    res.send(audio);
  } catch (err) {
    if (err instanceof TtsQuotaExceededError) {
      res.status(429).json({
        code: "APP_QUOTA_EXCEEDED",
        message: err.message,
        fallback: true,
        monthlyLimit: err.limit,
        used: err.used,
        monthKey: err.monthKey,
      });
      return;
    }

    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Empty text after sanitization")) {
      res.status(400).json({ code: "EMPTY_TEXT", fallback: true });
      return;
    }

    if (err instanceof ElevenLabsApiError) {
      if (err.status === 401 || err.status === 403) {
        let providerStatus = "unknown";
        try {
          const json = JSON.parse(err.message) as { detail?: { status?: string } };
          providerStatus = json.detail?.status ?? providerStatus;
        } catch {
          /* plain text */
        }
        logger.warn(
          {
            status: err.status,
            providerStatus,
            keyLength: elevenLabsConfig.apiKeyLength,
            detail: err.message.slice(0, 240),
          },
          "tts:invalid-api-key — compare elevenlabsKeyLength on /api/healthz with local .env",
        );
        res.status(503).json({
          code: "INVALID_API_KEY",
          message: "ElevenLabs rejected the API key",
          providerStatus,
          keyLength: elevenLabsConfig.apiKeyLength,
          fallback: true,
        });
        return;
      }
      if (err.status === 402 || err.status === 429) {
        logger.warn(
          { status: err.status, detail: err.message },
          "tts:provider-quota-exceeded",
        );
        res.status(429).json({
          code: "PROVIDER_QUOTA_EXCEEDED",
          message: "ElevenLabs account quota exceeded",
          fallback: true,
        });
        return;
      }
      logger.warn({ status: err.status, detail: err.message }, "tts:synthesize-provider-error");
      res.status(502).json({ code: "PROVIDER_ERROR", fallback: true, detail: err.message });
      return;
    }

    logger.warn({ err }, "tts:synthesize-failed");
    res.status(502).json({ code: "PROVIDER_ERROR", fallback: true });
  }
});

export default router;
