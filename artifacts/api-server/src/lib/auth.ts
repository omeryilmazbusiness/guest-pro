import crypto from "crypto";
import { db, usersTable, guestKeysTable, guestsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { env } from "../config/env";

// ---------------------------------------------------------------------------
// Password hashing — per-user random salt, PBKDF2 (v3)
//   Stored format:  "pbkdf2v3:<hex_salt>:<hex_hash>"
//   Legacy v2 format (static salt):  raw 64-char hex
//   Legacy v1 format (SHA-256):       raw 64-char hex
// ---------------------------------------------------------------------------
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";
const SALT_BYTES = 16;

export function generateSalt(): string {
  return crypto.randomBytes(SALT_BYTES).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
  return `pbkdf2v3:${salt}:${hash}`;
}

function verifyPasswordV3(password: string, stored: string): boolean {
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(hash, "hex"));
}

function hashPasswordV2(password: string): string {
  return crypto
    .pbkdf2Sync(password, "guestpro_v2", PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
}

function hashPasswordV1(password: string): string {
  return crypto.createHash("sha256").update(password + "guestpro_salt").digest("hex");
}

// ---------------------------------------------------------------------------
// Guest key generation
// ---------------------------------------------------------------------------
export function generateGuestKey(): { key: string; keyHash: string } {
  const segments = [
    crypto.randomBytes(3).toString("hex").toUpperCase(),
    crypto.randomBytes(3).toString("hex").toUpperCase(),
    crypto.randomBytes(3).toString("hex").toUpperCase(),
  ];
  const key = segments.join("-");
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, keyHash };
}

// ---------------------------------------------------------------------------
// Token — HMAC-signed, with expiry
//   Manager tokens expire in 12 hours
//   Guest tokens expire in 7 days
// ---------------------------------------------------------------------------
const TOKEN_TTL_MS: Record<string, number> = {
  manager: 12 * 60 * 60 * 1000,
  guest: 7 * 24 * 60 * 60 * 1000,
};

export function generateToken(
  userId: number,
  role: string,
  hotelId: number,
  guestId?: number
): string {
  const now = Date.now();
  const exp = now + (TOKEN_TTL_MS[role] ?? TOKEN_TTL_MS.manager);
  const payload = JSON.stringify({ userId, role, hotelId, guestId, iat: now, exp });
  const sig = crypto
    .createHmac("sha256", env.SESSION_SECRET!)
    .update(payload)
    .digest("hex");
  return Buffer.from(payload).toString("base64") + "." + sig;
}

export function verifyToken(
  token: string
): { userId: number; role: string; hotelId: number; guestId?: number } | null {
  try {
    const dotIdx = token.indexOf(".");
    if (dotIdx === -1) return null;
    const payloadB64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);
    if (!payloadB64 || !sig) return null;
    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expectedSig = crypto
      .createHmac("sha256", env.SESSION_SECRET!)
      .update(payload)
      .digest("hex");
    if (
      !crypto.timingSafeEqual(
        Buffer.from(sig, "hex"),
        Buffer.from(expectedSig, "hex")
      )
    ) {
      return null;
    }
    const data = JSON.parse(payload) as {
      userId: number;
      role: string;
      hotelId: number;
      guestId?: number;
      iat: number;
      exp?: number;
    };
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Brute-force protection — per-email/key in-memory rate limiter
//   10 failed attempts within 15 min → 15 min lockout
// ---------------------------------------------------------------------------
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

interface FailureEntry {
  count: number;
  firstAt: number;
  lockedUntil?: number;
}

const failedAttempts = new Map<string, FailureEntry>();

export function checkLoginRateLimit(
  key: string
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }
  if (now - entry.firstAt > FAILURE_WINDOW_MS) {
    failedAttempts.delete(key);
    return { allowed: true };
  }
  return { allowed: true };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(key);
  if (!entry || now - entry.firstAt > FAILURE_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count++;
  if (entry.count >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
}

export function clearFailedLogins(key: string): void {
  failedAttempts.delete(key);
}

// ---------------------------------------------------------------------------
// Manager authentication — upgrades legacy hashes transparently
// ---------------------------------------------------------------------------
export async function authenticateManager(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));
  if (!user || !user.passwordHash) return null;

  const hash = user.passwordHash;

  // v3: per-user salt
  if (hash.startsWith("pbkdf2v3:")) {
    return verifyPasswordV3(password, hash) ? user : null;
  }

  // v2: fixed salt PBKDF2
  const v2 = hashPasswordV2(password);
  if (hash === v2) {
    const salt = generateSalt();
    await db
      .update(usersTable)
      .set({ passwordHash: hashPassword(password, salt) })
      .where(eq(usersTable.id, user.id));
    return user;
  }

  // v1: legacy SHA-256
  const v1 = hashPasswordV1(password);
  if (hash === v1) {
    const salt = generateSalt();
    await db
      .update(usersTable)
      .set({ passwordHash: hashPassword(password, salt) })
      .where(eq(usersTable.id, user.id));
    return user;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Guest authentication — honours key expiry
// ---------------------------------------------------------------------------
export async function authenticateGuest(guestKey: string) {
  const keyHash = crypto.createHash("sha256").update(guestKey).digest("hex");
  const result = await db
    .select({ guestKey: guestKeysTable, guest: guestsTable })
    .from(guestKeysTable)
    .innerJoin(guestsTable, eq(guestKeysTable.guestId, guestsTable.id))
    .where(
      and(eq(guestKeysTable.keyHash, keyHash), eq(guestKeysTable.isActive, true))
    );
  if (!result.length) return null;
  const row = result[0];
  // Honour expiry if set
  if (row.guestKey.expiresAt && new Date() > row.guestKey.expiresAt) return null;
  return row;
}

// ---------------------------------------------------------------------------
// Google OAuth helpers
// ---------------------------------------------------------------------------
export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleProfile | null> {
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    if (!tokenData.access_token) return null;

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const profile = (await profileRes.json()) as GoogleProfile;
    return profile;
  } catch {
    return null;
  }
}

export async function findOrCreateGoogleManager(
  profile: GoogleProfile,
  hotelId: number
) {
  const normalizedEmail = profile.email.toLowerCase().trim();

  const [byProviderId] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.provider, "google"),
        eq(usersTable.providerAccountId, profile.id)
      )
    );
  if (byProviderId) return byProviderId;

  const [byEmail] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (byEmail) {
    const [updated] = await db
      .update(usersTable)
      .set({
        provider: "google",
        providerAccountId: profile.id,
        avatarUrl: profile.picture ?? null,
        firstName: byEmail.firstName ?? profile.given_name ?? null,
        lastName: byEmail.lastName ?? profile.family_name ?? null,
      })
      .where(eq(usersTable.id, byEmail.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      hotelId,
      email: normalizedEmail,
      provider: "google",
      providerAccountId: profile.id,
      role: "manager",
      firstName: profile.given_name ?? null,
      lastName: profile.family_name ?? null,
      avatarUrl: profile.picture ?? null,
    })
    .returning();

  return created;
}
