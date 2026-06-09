/**
 * Ensures a platform super-admin exists in local development.
 * Uses PLATFORM_ADMIN_EMAIL + PLATFORM_ADMIN_PASSWORD from .env (see .env.example).
 */

import crypto from "crypto";
import { db, platformAdminsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../logger";

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

function hashPasswordV3Compat(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
  return `pbkdf2v3:${salt}:${hash}`;
}

export async function ensureDevPlatformAdmin(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  const email = (process.env.PLATFORM_ADMIN_EMAIL ?? process.env.GMAIL_USER ?? "")
    .trim()
    .toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(platformAdminsTable);
    if (Number(count) === 0) {
      logger.warn(
        "No platform admin in database. Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD in .env, " +
          "or run: pnpm exec tsx scripts/src/create-platform-admin.ts <email> <password>",
      );
    }
    return;
  }

  const [existing] = await db
    .select({ id: platformAdminsTable.id })
    .from(platformAdminsTable)
    .where(eq(platformAdminsTable.email, email))
    .limit(1);

  if (existing) return;

  const passwordHash = hashPasswordV3Compat(password);
  await db.insert(platformAdminsTable).values({
    email,
    passwordHash,
    firstName: "Platform",
    lastName: "Admin",
    isActive: true,
  });

  logger.info(
    { email },
    "Dev platform admin created from PLATFORM_ADMIN_EMAIL — sign in at /platform/login",
  );
}
