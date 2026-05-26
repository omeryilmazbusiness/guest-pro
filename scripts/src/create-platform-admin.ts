/**
 * Create the first platform super-admin account.
 *
 * Usage:
 *   DATABASE_URL=... pnpm exec tsx scripts/src/create-platform-admin.ts
 *
 * Or with args:
 *   pnpm exec tsx scripts/src/create-platform-admin.ts admin@example.com 'SecurePass123!' "Ada" "Lovelace"
 */
import "dotenv/config";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
  return `pbkdf2v3:${salt}:${hash}`;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const email = (process.argv[2] ?? process.env.PLATFORM_ADMIN_EMAIL ?? "").toLowerCase().trim();
  const password = process.argv[3] ?? process.env.PLATFORM_ADMIN_PASSWORD ?? "";
  const firstName = process.argv[4] ?? "Platform";
  const lastName = process.argv[5] ?? "Admin";

  if (!email || !password) {
    console.error("Usage: create-platform-admin.ts <email> <password> [firstName] [lastName]");
    console.error("Or set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  const existing = await db.execute(
    sql`SELECT id FROM platform_admins WHERE email = ${email} LIMIT 1`,
  );
  if (existing.rows.length > 0) {
    console.error(`Platform admin already exists for ${email}`);
    await pool.end();
    process.exit(1);
  }

  const result = await db.execute(
    sql`INSERT INTO platform_admins (email, password_hash, first_name, last_name, is_active)
        VALUES (${email}, ${hashPassword(password)}, ${firstName}, ${lastName}, true)
        RETURNING id`,
  );

  console.log(`Platform admin created (id=${result.rows[0].id})`);
  console.log(`Sign in at: /platform/login`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
