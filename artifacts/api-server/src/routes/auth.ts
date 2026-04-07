import crypto from "crypto";
import { Router } from "express";
import type { IRouter, Request } from "express";
import { db, usersTable, guestKeysTable, guestsTable, hotelsTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  authenticateManager,
  authenticateGuest,
  generateToken,
  verifyToken,
  exchangeGoogleCode,
  findOrCreateGoogleManager,
} from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";
import { env } from "../config/env";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const oauthStateStore = new Map<string, { expiresAt: number }>();

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

function cleanOauthStates() {
  const now = Date.now();
  for (const [k, v] of oauthStateStore) {
    if (now > v.expiresAt) oauthStateStore.delete(k);
  }
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { type, email, password, guestKey } = req.body;

  if (type === "manager") {
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const user = await authenticateManager(email as string, password as string);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, "manager", user.hotelId);
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

  if (type === "guest") {
    if (!guestKey) {
      res.status(400).json({ error: "Guest key required" });
      return;
    }
    const result = await authenticateGuest(guestKey as string);
    if (!result) {
      res.status(401).json({ error: "Invalid or inactive guest key" });
      return;
    }
    const { guest } = result;
    const syntheticUserId = guest.id * -1;
    const token = generateToken(syntheticUserId, "guest", guest.hotelId, guest.id);
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
      },
    });
    return;
  }

  res.status(400).json({ error: "Invalid login type" });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

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
    });
    return;
  }

  res.status(401).json({ error: "Invalid session" });
});

router.get("/auth/google", (req, res): void => {
  if (!env.isGoogleConfigured) {
    const frontendBase = getFrontendBase(req);
    res.redirect(`${frontendBase}/?error=google_not_configured`);
    return;
  }

  cleanOauthStates();
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

    await db.insert(auditLogsTable).values({
      hotelId: user.hotelId,
      actorId: user.id,
      actorType: "manager",
      action: "google_login",
      targetType: "user",
      targetId: user.id,
      metadata: { email: user.email, provider: "google" },
    });

    res.redirect(`${frontendBase}/?google_token=${encodeURIComponent(token)}`);
  } catch (err) {
    logger.error({ err }, "Google OAuth error");
    res.redirect(`${frontendBase}/?error=google_server_error`);
  }
});

router.get("/auth/google/status", (_req, res): void => {
  res.json({ configured: env.isGoogleConfigured });
});

export default router;
