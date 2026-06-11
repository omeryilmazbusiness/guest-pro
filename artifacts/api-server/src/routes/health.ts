import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { BUNDLE_BUILD_STAMP, SERVER_STARTED_AT } from "../lib/build-stamp";
import { elevenLabsConfig } from "../lib/elevenlabs/config";
import { getElevenLabsTtsProbe } from "../lib/elevenlabs/probe";

const router: IRouter = Router();

const healthSchema = HealthCheckResponse.extend({
  buildStamp: HealthCheckResponse.shape.status.optional(),
  startedAt: HealthCheckResponse.shape.status.optional(),
  elevenlabsConfigured: HealthCheckResponse.shape.status.optional(),
  elevenlabsKeyLength: HealthCheckResponse.shape.status.optional(),
  elevenlabsTtsProbe: HealthCheckResponse.shape.status.optional(),
});

router.get("/healthz", async (_req, res) => {
  const probe = elevenLabsConfig.isConfigured
    ? await getElevenLabsTtsProbe(false)
    : null;

  const data = healthSchema.parse({
    status: "ok",
    ...(BUNDLE_BUILD_STAMP ? { buildStamp: BUNDLE_BUILD_STAMP } : {}),
    startedAt: SERVER_STARTED_AT,
    elevenlabsConfigured: elevenLabsConfig.isConfigured ? "yes" : "no",
    ...(elevenLabsConfig.isConfigured
      ? {
          elevenlabsKeyLength: String(elevenLabsConfig.apiKeyLength),
          elevenlabsTtsProbe: probe?.ok ? "ok" : (probe?.status ?? "pending"),
        }
      : {}),
  });
  res.json(data);
});

/** Force-refresh ElevenLabs TTS probe (ops debugging). */
router.get("/healthz/tts-probe", async (_req, res) => {
  if (!elevenLabsConfig.isConfigured) {
    res.status(503).json({ ok: false, status: "missing_env", keyLength: 0 });
    return;
  }
  const probe = await getElevenLabsTtsProbe(true);
  res.json(probe);
});

export default router;
