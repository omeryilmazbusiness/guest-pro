import crypto from "crypto";
import { db, usersTable, guestKeysTable, guestsTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { env } from "../config/env";

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";
const PBKDF2_SALT = "guestpro_v2";

export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, PBKDF2_SALT, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
}

function hashPasswordLegacy(password: string): string {
  return crypto.createHash("sha256").update(password + "guestpro_salt").digest("hex");
}

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

export function generateToken(
  userId: number,
  role: string,
  hotelId: number,
  guestId?: number
): string {
  const payload = JSON.stringify({ userId, role, hotelId, guestId, iat: Date.now() });
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
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expectedSig = crypto
      .createHmac("sha256", env.SESSION_SECRET!)
      .update(payload)
      .digest("hex");
    if (sig !== expectedSig) return null;
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function authenticateManager(email: string, password: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !user.passwordHash) return null;

  const newHash = hashPassword(password);
  if (user.passwordHash === newHash) return user;

  const legacyHash = hashPasswordLegacy(password);
  if (user.passwordHash === legacyHash) {
    await db
      .update(usersTable)
      .set({ passwordHash: newHash })
      .where(eq(usersTable.id, user.id));
    return user;
  }

  return null;
}

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
  return result[0];
}

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

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) return null;

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json() as GoogleProfile;
    return profile;
  } catch {
    return null;
  }
}

export async function findOrCreateGoogleManager(
  profile: GoogleProfile,
  hotelId: number
) {
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
    .where(eq(usersTable.email, profile.email));

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
      email: profile.email,
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
