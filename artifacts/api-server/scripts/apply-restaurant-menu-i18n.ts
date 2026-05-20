/**
 * Applies the restaurant_menu_items i18n columns in a production DB.
 * Safe to run multiple times.
 *
 * Usage:
 *   DATABASE_URL=... pnpm exec tsx scripts/apply-restaurant-menu-i18n.ts
 */
import "dotenv/config";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    ALTER TABLE "restaurant_menu_items"
      ADD COLUMN IF NOT EXISTS "name_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL;
  `);

  await db.execute(sql`
    ALTER TABLE "restaurant_menu_items"
      ADD COLUMN IF NOT EXISTS "description_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL;
  `);

  console.log("OK: restaurant_menu_items i18n columns ensured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

