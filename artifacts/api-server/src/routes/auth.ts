import crypto from "crypto";
import { Router } from "express";
import type { IRouter, Request } from "express";
import { z } from "zod";
import { db, usersTable, guestKeysTable, guestsTable, hotelsTable, auditLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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
import { isStaffRole } from "../lib/roles";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { lookupValidQrToken, consumeValidQrToken } from "../lib/qr-token";
import { deriveLocaleFromCountry } from "../lib/locale";
import { evaluateStayAccess } from "../lib/guest-stay-policy";

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
    // Use the user's actual DB role (manager or personnel) — never hardcode "manager"
    const staffRole = user.role;
    const token = generateToken(user.id, staffRole, user.hotelId);

    db.insert(auditLogsTable)
      .values({
        hotelId: user.hotelId,
        actorId: user.id,
        actorType: staffRole,
        action: "login_success",
        targetType: "user",
        targetId: user.id,
        metadata: { email: user.email, provider: "local", role: staffRole, ip: getClientIp(req) },
      })
      .catch(() => {});

    res.json({
      role: staffRole,
      token,
      user: {
        id: user.id,
        role: staffRole,
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

    // ── Stay-window policy ────────────────────────────────────────────────────
    // Credentials are valid — now enforce the stay access window.
    // evaluateStayAccess returns a specific code (stay_upcoming / stay_expired)
    // and a guest-facing message, or null when access is permitted.
    const stayDenial = evaluateStayAccess({
      checkInDate: guest.checkInDate,
      checkOutDate: guest.checkOutDate,
    });
    if (stayDenial) {
      db.insert(auditLogsTable)
        .values({
          hotelId: guest.hotelId,
          actorId: null,
          actorType: "guest",
          action: "login_denied_stay_window",
          targetType: "guest",
          targetId: guest.id,
          metadata: {
            code: stayDenial.code,
            checkInDate: guest.checkInDate,
            checkOutDate: guest.checkOutDate,
            ip: getClientIp(req),
          },
        })
        .catch(() => {});
      res.status(403).json({ error: stayDenial.message, code: stayDenial.code });
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

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

  // Handle all staff roles (manager, personnel) the same way
  if (isStaffRole(session.role)) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    // Return the DB role, not the session role, so a permission change takes effect on next /auth/me call
    res.json({
      id: user.id,
      role: user.role,
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

    // ── Re-validate stay window on every /auth/me call ────────────────────────
    // This ensures that when a stay expires the guest is logged out on the next
    // poll, and when a manager extends the stay the guest regains access
    // immediately on the next poll — without requiring a new login.
    const sessionDenial = evaluateStayAccess({
      checkInDate: guest.checkInDate,
      checkOutDate: guest.checkOutDate,
    });
    if (sessionDenial) {
      // Return 401 so the frontend treats the session as expired and redirects
      // the guest to the login page, where they will see the specific message
      // upon their next login attempt.
      res.status(401).json({ error: sessionDenial.message, code: sessionDenial.code });
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { voiceLocale } = deriveLocaleFromCountry(guest.countryCode ?? "TR");
    const resolvedLanguage = guest.language || voiceLocale;

    const [activeKey] = await db
      .select({ keyDisplay: guestKeysTable.keyDisplay })
      .from(guestKeysTable)
      .where(and(eq(guestKeysTable.guestId, guest.id), eq(guestKeysTable.isActive, true)))
      .limit(1);

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
      guestKeyDisplay: activeKey?.keyDisplay ?? null,
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
    // Google OAuth creates/finds users always with manager role
    const token = generateToken(user.id, user.role, user.hotelId);

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

// ---------------------------------------------------------------------------
// GET /auth/guest/qr-login?token=<rawToken>
//   Validates a single-use QR auto-login token and creates a guest session.
//
//   IMPORTANT — validate-then-consume pattern:
//   We intentionally separate token validation from token consumption so that
//   a stay-window denial does NOT burn the QR code.  This allows a guest to:
//     • Receive their QR at any time before check-in
//     • Scan it on their actual check-in date and succeed
//     • Not need staff intervention just because they scanned too early
//
//   Order of operations:
//     1. Validate QR token (cryptographic check only, no DB mutation)
//     2. Load fresh guest record
//     3. Evaluate stay-window policy
//     4. If denied → return error with specific code; token remains valid
//     5. If allowed → consume token (single-use enforcement), issue session JWT
// ---------------------------------------------------------------------------
router.get("/auth/guest/qr-login", async (req, res): Promise<void> => {
  const rawToken = req.query.token as string | undefined;
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 10) {
    res.status(400).json({ error: "Missing or malformed token", code: "invalid_token" });
    return;
  }

  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] ?? undefined;
  const meta = { ip, userAgent };

  // ── Step 1: Validate the QR token (read-only — no DB mutations yet) ────────
  const validation = await lookupValidQrToken(rawToken, meta);
  if (!validation) {
    // Don't reveal whether the token was expired, used, or never existed
    res.status(401).json({
      error: "This QR code is no longer valid. Please ask hotel staff for a new one.",
      code: "qr_invalid",
    });
    return;
  }

  // ── Step 2: Load the fresh guest record ────────────────────────────────────
  const [guest] = await db
    .select()
    .from(guestsTable)
    .where(eq(guestsTable.id, validation.guestId));

  if (!guest) {
    res.status(404).json({ error: "Guest account not found", code: "guest_not_found" });
    return;
  }

  // ── Step 3: Evaluate stay-window policy ─────────────────────────────────────
  // Enforce the stay window BEFORE consuming the token so that a denial (e.g.,
  // "upcoming stay") does not permanently invalidate the QR.  The guest can
  // scan the same QR code when their check-in date arrives.
  const stayDenial = evaluateStayAccess({
    checkInDate: guest.checkInDate,
    checkOutDate: guest.checkOutDate,
  });

  if (stayDenial) {
    // Token is NOT consumed — guest can retry on their check-in date.
    db.insert(auditLogsTable)
      .values({
        hotelId: guest.hotelId,
        actorId: null,
        actorType: "guest",
        action: "qr_login_denied_stay_window",
        targetType: "guest",
        targetId: guest.id,
        metadata: {
          code: stayDenial.code,
          checkInDate: guest.checkInDate,
          checkOutDate: guest.checkOutDate,
          ip,
        },
      })
      .catch(() => {});

    res.status(403).json({ error: stayDenial.message, code: stayDenial.code });
    return;
  }

  // ── Step 4: All checks passed — consume the token (single-use enforcement) ─
  await consumeValidQrToken(validation.rowId, meta);

  // ── Step 5: Issue the guest session JWT ────────────────────────────────────
  const syntheticUserId = guest.id * -1;
  const token = generateToken(syntheticUserId, "guest", validation.hotelId, guest.id);

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
});

export default router;
