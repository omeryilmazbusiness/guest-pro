/**
 * Clear platform login lockout for an email (Redis + allows retry).
 *   DATABASE_URL=... REDIS_URL=... node scripts/clear-platform-lockout.mjs superadmin@guestpro.com
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Redis from "ioredis";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(root, ".env"), override: true });

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: clear-platform-lockout.mjs <email>");
  process.exit(1);
}

const key = `platform:login-lockout:${email}`;

if (process.env.REDIS_URL) {
  const redis = new Redis(process.env.REDIS_URL);
  await redis.del(key);
  await redis.quit();
  console.log(`Redis lockout cleared for ${email}`);
} else {
  console.log("REDIS_URL not set — skip Redis");
}

console.log("Done. User can retry login.");
