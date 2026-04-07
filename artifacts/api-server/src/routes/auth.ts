import crypto from "crypto";
import { Router } from "express";
import type { IRouter, Request } from "express";
import { z } from "zod";
import { db, usersTable, guestKeysTable, guestsTable, hotelsTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { deriveLocaleFromCountry } from "../lib/locale";
import {
  authenticateManager,
  authenticateGuest,
  generateToken,
  verifyToken,
  exchangeGoogleCode,
  findOrCreateGoogleManager,
  checkLoginRateLimit,
  recordFailedLogin,
  clearFailedLogins,
} from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";
import { env } from "../config/env";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Request schemas
// ---------------------------------------------------------------------------
const loginSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("manager"),
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password required").max(200),
  }),
  z.object({
    type: z.literal("guest"),
    guestKey: z.string().min(1, "Guest key required").max(100),
  }),
]);

// ---------------------------------------------------------------------------
// Google OAuth state and exchange-code stores
// ---------------------------------------------------------------------------
const oauthStateStore = new Map<string, { expiresAt: number }>();
const googleExchangeCodes = new Map<string, { token: string; expiresAt: number }>();

function computeRedirectUri(req: Request): string {
  if (env.GOOGLE_REDIRECT_URI) return env.GOOGLE_REDIRECT_URI;
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}

function getFrontendBase(req: Request): string {
  if (env.APP_BASE_URL) return env.APP_BASE_URL;
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host;
  return `${proto}://${host}`;
}

function cleanExpiredEntries() {
  const now = Date.now();
  for (const [k, v] of oauthStateStore) {
    if (now > v.expiresAt) oauthStateStore.delete(k);
  }
  for (const [k, v] of googleExchangeCodes) {
    if (now > v.expiresAt) googleExchangeCodes.delete(k);
  }
}

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    req.socket.remoteAddress ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const body = parsed.data;

  if (body.type === "manager") {
    const rateLimitKey = `manager:${body.email.toLowerCase()}`;
    const rateCheck = checkLoginRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      const waitMin = Math.ceil((rateCheck.retryAfterMs ?? 0) / 60_000);
      res.status(429).json({
        error: `Too many failed attempts. Try again in ${waitMin} minute${waitMin !== 1 ? "s" : ""}.`,
      });
      return;
    }

    const user = await authenticateManager(body.email, body.password);
    if (!user) {
      recordFailedLogin(rateLimitKey);
      // Audit failed attempt — fire-and-forget
      db.insert(auditLogsTable)
        .values({
          hotelId: null,
          actorId: null,
          actorType: "manager",
          action: "login_failed",
          targetType: "email",
          targetId: null,
          metadata: { email: body.email.toLowerCase(), reason: "invalid_credentials", ip: getClientIp(req) },
        })
        .catch(() => {});
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    clearFailedLogins(rateLimitKey);
    const token = generateToken(user.id, "manager", user.hotelId);

    db.insert(auditLogsTable)
      .values({
        hotelId: user.hotelId,
        actorId: user.id,
        actorType: "manager",
        action: "login_success",
        targetType: "user",
        targetId: user.id,
        metadata: { email: user.email, provider: "local", ip: getClientIp(req) },
      })
      .catch(() => {});

    res.json({
      role: "manager",
      token,
      user: {
        id: user.id,
        role: "manager",
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl ?? null,
        roomNumber: null,
        guestId: null,
        hotelId: user.hotelId,
      },
    });
    return;
  }

  if (body.type === "guest") {
    const result = await authenticateGuest(body.guestKey);
    if (!result) {
      res.status(401).json({ error: "Invalid or inactive guest key" });
      return;
    }
    const { guest } = result;
    const syntheticUserId = guest.id * -1;
    const token = generateToken(syntheticUserId, "guest", guest.hotelId, guest.id);
    // Derive voice locale from stored language (stored at creation) or countryCode as fallback
    const { voiceLocale } = deriveLocaleFromCountry(guest.countryCode ?? "TR");
    const resolvedLanguage = guest.language || voiceLocale;
    res.json({
      role: "guest",
      token,
      user: {
        id: syntheticUserId,
        role: "guest",
        email: null,
        firstName: guest.firstName,
        lastName: guest.lastName,
        avatarUrl: null,
        roomNumber: guest.roomNumber,
        guestId: guest.id,
        hotelId: guest.hotelId,
        countryCode: guest.countryCode ?? "TR",
        language: resolvedLanguage,
      },
    });
    return;
  }

  res.status(400).json({ error: "Invalid login type" });
});

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------
router.post("/auth/logout", (_req, res): void => {
  // Token revocation is not supported (stateless HMAC tokens).
  // Clients must clear their stored token on receipt of this response.
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const session = req.session!;

  if (session.role === "manager") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      role: "manager",
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl ?? null,
      roomNumber: null,
      guestId: null,
      hotelId: user.hotelId,
    });
    return;
  }

  if (session.role === "guest" && session.guestId) {
    const [guest] = await db.select().from(guestsTable).where(eq(guestsTable.id, session.guestId));
    if (!guest) {
      res.status(401).json({ error: "Guest not found" });
      return;
    }
    const { voiceLocale } = deriveLocaleFromCountry(guest.countryCode ?? "TR");
    const resolvedLanguage = guest.language || voiceLocale;
    res.json({
      id: session.userId,
      role: "guest",
      email: null,
      firstName: guest.firstName,
      lastName: guest.lastName,
      avatarUrl: null,
      roomNumber: guest.roomNumber,
      guestId: guest.id,
      hotelId: guest.hotelId,
      countryCode: guest.countryCode ?? "TR",
      language: resolvedLanguage,
    });
    return;
  }

  res.status(401).json({ error: "Invalid session" });
});

// ---------------------------------------------------------------------------
// GET /auth/google  — initiate OAuth flow
// ---------------------------------------------------------------------------
router.get("/auth/google", (req, res): void => {
  if (!env.isGoogleConfigured) {
    const frontendBase = getFrontendBase(req);
    res.redirect(`${frontendBase}/?error=google_not_configured`);
    return;
  }

  cleanExpiredEntries();
  const state = crypto.randomBytes(16).toString("hex");
  oauthStateStore.set(state, { expiresAt: Date.now() + 5 * 60 * 1000 });

  const redirectUri = computeRedirectUri(req);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ---------------------------------------------------------------------------
// GET /auth/google/callback  — OAuth callback, issues exchange code
// ---------------------------------------------------------------------------
router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const frontendBase = getFrontendBase(req);
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect(`${frontendBase}/?error=google_denied`);
    return;
  }

  if (!state || !oauthStateStore.has(state)) {
    res.redirect(`${frontendBase}/?error=google_invalid_state`);
    return;
  }
  oauthStateStore.delete(state);

  if (!code) {
    res.redirect(`${frontendBase}/?error=google_no_code`);
    return;
  }

  const redirectUri = computeRedirectUri(req);
  const profile = await exchangeGoogleCode(code, redirectUri);
  if (!profile || !profile.email) {
    res.redirect(`${frontendBase}/?error=google_profile_failed`);
    return;
  }

  try {
    const [hotel] = await db.select().from(hotelsTable).limit(1);
    if (!hotel) {
      res.redirect(`${frontendBase}/?error=google_no_hotel`);
      return;
    }

    const user = await findOrCreateGoogleManager(profile, hotel.id);
    const token = generateToken(user.id, "manager", user.hotelId);

    // Issue a short-lived exchange code (60 s) — keeps the real token out of
    // browser history and server access logs.
    const exchangeCode = crypto.randomBytes(24).toString("hex");
    googleExchangeCodes.set(exchangeCode, { token, expiresAt: Date.now() + 60_000 });

    db.insert(auditLogsTable)
      .values({
        hotelId: user.hotelId,
        actorId: user.id,
        actorType: "manager",
        action: "google_login",
        targetType: "user",
        targetId: user.id,
        metadata: { email: user.email, provider: "google", ip: getClientIp(req) },
      })
      .catch(() => {});

    res.redirect(`${frontendBase}/?google_code=${encodeURIComponent(exchangeCode)}`);
  } catch (err) {
    logger.error({ err }, "Google OAuth callback error");
    res.redirect(`${frontendBase}/?error=google_server_error`);
  }
});

// ---------------------------------------------------------------------------
// GET /auth/google/exchange  — redeem exchange code for real token (once only)
// ---------------------------------------------------------------------------
router.get("/auth/google/exchange", (req, res): void => {
  cleanExpiredEntries();
  const { code } = req.query as Record<string, string>;
  if (!code) {
    res.status(400).json({ error: "Exchange code required" });
    return;
  }

  const entry = googleExchangeCodes.get(code);
  googleExchangeCodes.delete(code); // single-use
  if (!entry || Date.now() > entry.expiresAt) {
    res.status(401).json({ error: "Invalid or expired exchange code" });
    return;
  }

  const session = verifyToken(entry.token);
  if (!session) {
    res.status(401).json({ error: "Token validation failed" });
    return;
  }

  res.json({ token: entry.token });
});

// ---------------------------------------------------------------------------
// GET /auth/google/status
// ---------------------------------------------------------------------------
router.get("/auth/google/status", (_req, res): void => {
  res.json({ configured: env.isGoogleConfigured });
});

export default router;
