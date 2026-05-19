/**
 * Reset a staff user's password (local dev helper).
 * Usage: DOTENV_CONFIG_PATH=../../.env pnpm exec tsx scripts/reset-password.ts <email> <password>
 */
import "dotenv/config";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateSalt } from "../src/lib/auth";

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  const password = process.argv[3];
  if (!email || !password) {
    console.error("Usage: tsx scripts/reset-password.ts <email> <password>");
    process.exit(1);
  }

  const salt = generateSalt();
  const [updated] = await db
    .update(usersTable)
    .set({ passwordHash: hashPassword(password, salt) })
    .where(eq(usersTable.email, email))
    .returning({ id: usersTable.id, email: usersTable.email });

  if (!updated) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  console.log(`Password updated for ${updated.email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
