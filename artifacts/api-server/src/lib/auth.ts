import crypto from "crypto";
import { db, usersTable, guestKeysTable, guestsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export function hashPassword(password: string): string {
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

export function generateToken(userId: number, role: string, hotelId: number, guestId?: number): string {
  const payload = JSON.stringify({ userId, role, hotelId, guestId, iat: Date.now() });
  const secret = process.env.SESSION_SECRET ?? "guestpro_secret";
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + sig;
}

export function verifyToken(token: string): { userId: number; role: string; hotelId: number; guestId?: number } | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const secret = process.env.SESSION_SECRET ?? "guestpro_secret";
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (sig !== expectedSig) return null;
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function authenticateManager(email: string, password: string) {
  const passwordHash = hashPassword(password);
  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.email, email), eq(usersTable.passwordHash, passwordHash)));
  return user ?? null;
}

export async function authenticateGuest(guestKey: string) {
  const keyHash = crypto.createHash("sha256").update(guestKey).digest("hex");
  const result = await db
    .select({
      guestKey: guestKeysTable,
      guest: guestsTable,
    })
    .from(guestKeysTable)
    .innerJoin(guestsTable, eq(guestKeysTable.guestId, guestsTable.id))
    .where(and(eq(guestKeysTable.keyHash, keyHash), eq(guestKeysTable.isActive, true)));
  if (!result.length) return null;
  return result[0];
}
