import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { BUNDLE_BUILD_STAMP, SERVER_STARTED_AT } from "../lib/build-stamp";
import { elevenLabsConfig } from "../lib/elevenlabs/config";

const router: IRouter = Router();

const healthSchema = HealthCheckResponse.extend({
  buildStamp: HealthCheckResponse.shape.status.optional(),
  startedAt: HealthCheckResponse.shape.status.optional(),
  elevenlabsConfigured: HealthCheckResponse.shape.status.optional(),
});

router.get("/healthz", (_req, res) => {
  const data = healthSchema.parse({
    status: "ok",
    ...(BUNDLE_BUILD_STAMP ? { buildStamp: BUNDLE_BUILD_STAMP } : {}),
    startedAt: SERVER_STARTED_AT,
    elevenlabsConfigured: elevenLabsConfig.isConfigured ? "yes" : "no",
  });
  res.json(data);
});

export default router;
