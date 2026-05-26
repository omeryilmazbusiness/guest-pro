import { Router } from "express";
import type { IRouter } from "express";
import { z } from "zod";
import {
  platformLoginAuthService,
  PlatformAuthError,
} from "../lib/platform-auth/platform-login-auth-service";
import { platformSettingsRepository } from "../lib/platform-auth/platform-settings-repository";
import {
  createPlatformAuthLogger,
  newRequestId,
} from "../lib/platform-auth/platform-auth-log";
import { requirePlatformAdmin } from "../middlewares/requirePlatformAdmin";
import { logPlatformAudit } from "../lib/platform-audit";

const router: IRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

const verifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  email: z.string().email(),
});

const verificationEmailSchema = z.object({
  verificationEmail: z.string().email(),
});

function handleAuthError(
  err: unknown,
  res: import("express").Response,
  log: ReturnType<typeof createPlatformAuthLogger>,
): void {
  if (err instanceof PlatformAuthError) {
    log.fail("auth_error", err, { statusCode: err.statusCode });
    const body: { error: string; retryAfterMs?: number; requestId: string } = {
      error: err.message,
      requestId: log.requestId,
    };
    if (err.retryAfterMs) body.retryAfterMs = err.retryAfterMs;
    res.status(err.statusCode).json(body);
    return;
  }
  log.fail("auth_error", err, { statusCode: 500 });
  throw err;
}

// POST /platform/auth/login — step 1: credentials → email OTP
router.post("/platform/auth/login", async (req, res): Promise<void> => {
  const requestId = newRequestId(req.headers["x-request-id"]);
  const log = createPlatformAuthLogger(requestId);
  res.setHeader("X-Request-Id", requestId);

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Invalid request",
      requestId,
    });
    return;
  }
  try {
    const result = await platformLoginAuthService.startLogin(
      parsed.data.email,
      parsed.data.password,
      log,
    );
    res.json(result);
  } catch (err) {
    handleAuthError(err, res, log);
  }
});

// POST /platform/auth/verify-otp — step 2: OTP → session token
router.post("/platform/auth/verify-otp", async (req, res): Promise<void> => {
  const requestId = newRequestId(req.headers["x-request-id"]);
  const log = createPlatformAuthLogger(requestId);
  res.setHeader("X-Request-Id", requestId);

  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Invalid request",
      requestId,
    });
    return;
  }
  try {
    const result = await platformLoginAuthService.verifyOtp(
      parsed.data.challengeId,
      parsed.data.code,
      parsed.data.email,
      log,
    );
    res.json(result);
  } catch (err) {
    handleAuthError(err, res, log);
  }
});

// GET /platform/settings — security settings (authenticated)
router.get("/platform/settings", requirePlatformAdmin, async (req, res): Promise<void> => {
  const verificationEmail = await platformSettingsRepository.getVerificationEmail();
  res.json({ verificationEmail });
});

// PATCH /platform/settings — update verification email
router.patch("/platform/settings", requirePlatformAdmin, async (req, res): Promise<void> => {
  const parsed = verificationEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const verificationEmail = await platformSettingsRepository.setVerificationEmail(
    parsed.data.verificationEmail,
    req.session!.userId,
  );
  await logPlatformAudit(req.session!.userId, "platform_update_settings", {
    verificationEmail,
  });
  res.json({ verificationEmail });
});

export default router;
