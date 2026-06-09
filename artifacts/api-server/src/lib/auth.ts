import crypto from "crypto";
import { db, usersTable, guestKeysTable, guestsTable, platformAdminsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { env } from "../config/env";
import { PLATFORM_ADMIN_ROLE, PLATFORM_HOTEL_ID, TOKEN_TTL_BY_ROLE } from "./roles";
import {
  tokenWithinRefreshGrace,
  type SessionTokenPayload,
} from "./session-policy";
import {
  loginLimiter,
  checkLimit,
  consumeLimit,
  clearLimit,
  type RateLimitResult,
} from "./rate-limiter";

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
// Token — HMAC-signed, with expiry (persistent for guest/staff; see session-policy)
// ---------------------------------------------------------------------------
export function generateToken(
  userId: number,
  role: string,
  hotelId: number,
  guestId?: number,
  staffDepartment?: string | null
): string {
  const now = Date.now();
  const exp = now + (TOKEN_TTL_BY_ROLE[role] ?? TOKEN_TTL_BY_ROLE.manager);
  const payload = JSON.stringify({ userId, role, hotelId, guestId, staffDepartment: staffDepartment ?? null, iat: now, exp });
  const sig = crypto
    .createHmac("sha256", env.SESSION_SECRET!)
    .update(payload)
    .digest("hex");
  return Buffer.from(payload).toString("base64") + "." + sig;
}

/** Platform super-admin JWT (no hotel binding). */
export function generatePlatformAdminToken(adminId: number): string {
  return generateToken(adminId, PLATFORM_ADMIN_ROLE, PLATFORM_HOTEL_ID);
}

function parseSignedToken(token: string): SessionTokenPayload | null {
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
      Buffer.from(expectedSig, "hex"),
    )
  ) {
    return null;
  }
  const data = JSON.parse(payload) as SessionTokenPayload;
  if (
    typeof data.userId !== "number" ||
    typeof data.role !== "string" ||
    typeof data.hotelId !== "number" ||
    typeof data.iat !== "number" ||
    typeof data.exp !== "number"
  ) {
    return null;
  }
  return data;
}

export function verifyToken(
  token: string,
): Omit<SessionTokenPayload, "iat" | "exp"> & { iat: number; exp?: number } | null {
  try {
    const data = parseSignedToken(token);
    if (!data?.exp) return null;
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

/** Accept valid or recently-expired tokens for POST /auth/refresh. */
export function verifyTokenForRefresh(token: string): SessionTokenPayload | null {
  try {
    const data = parseSignedToken(token);
    if (!data?.exp) return null;
    if (Date.now() <= data.exp) return data;
    if (tokenWithinRefreshGrace(data.exp)) return data;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Brute-force protection — delegated to Redis-backed rate-limiter
// The in-memory Map has been removed; all state lives in Redis so it
// survives process restarts and works across multiple instances.
// ---------------------------------------------------------------------------

export async function checkLoginRateLimit(key: string): Promise<RateLimitResult> {
  return checkLimit(loginLimiter, key);
}

export async function recordFailedLogin(key: string): Promise<void> {
  await consumeLimit(loginLimiter, key);
}

export async function clearFailedLogins(key: string): Promise<void> {
  await clearLimit(loginLimiter, key);
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

  // Deactivated staff members cannot log in regardless of correct credentials
  if (user.isActive === false) return null;

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
// Employee portal authentication — 4-digit employee number per hotel
// ---------------------------------------------------------------------------
export async function authenticateEmployee(hotelId: number, employeeNumber: string) {
  const normalized = employeeNumber.trim();
  if (!/^\d{4}$/.test(normalized)) return null;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.hotelId, hotelId),
        eq(usersTable.employeeNumber, normalized),
        eq(usersTable.role, "personnel"),
        eq(usersTable.isActive, true),
      ),
    );

  if (!user) return null;
  if (user.staffDepartment === "RECEPTION" || user.staffDepartment === "RESTAURANT") {
    return null;
  }

  return user;
}

// ---------------------------------------------------------------------------
// Platform super-admin authentication
// ---------------------------------------------------------------------------
export async function authenticatePlatformAdmin(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const [admin] = await db
    .select()
    .from(platformAdminsTable)
    .where(eq(platformAdminsTable.email, normalizedEmail));
  if (!admin || !admin.isActive) return null;

  const hash = admin.passwordHash;
  if (hash.startsWith("pbkdf2v3:")) {
    return verifyPasswordV3(password, hash) ? admin : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Guest authentication — honours key expiry
// ---------------------------------------------------------------------------
export async function authenticateGuest(guestKey: string, hotelId?: number) {
  const normalized = guestKey.trim().toUpperCase();
  if (!normalized) return null;

  const keyHash = crypto.createHash("sha256").update(normalized).digest("hex");
  const keyMatch = or(
    eq(guestKeysTable.keyHash, keyHash),
    eq(guestKeysTable.keyDisplay, normalized),
  );

  const conditions = [keyMatch, eq(guestKeysTable.isActive, true)];
  if (hotelId != null) {
    conditions.push(eq(guestKeysTable.hotelId, hotelId));
  }

  const result = await db
    .select({ guestKey: guestKeysTable, guest: guestsTable })
    .from(guestKeysTable)
    .innerJoin(guestsTable, eq(guestKeysTable.guestId, guestsTable.id))
    .where(and(...conditions));

  if (!result.length) return null;
  const row = result[0];
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
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
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
