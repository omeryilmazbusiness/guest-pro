/**
 * Ensure a RESTAURANT personnel user exists for local/dev testing.
 * Usage: DOTENV_CONFIG_PATH=../../.env pnpm exec tsx scripts/ensure-restaurant-user.ts [--hotel-slug local-hotel]
 */
import "dotenv/config";
import { db, usersTable, hotelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, generateSalt } from "../src/lib/auth";

async function main() {
  const slugArg = process.argv.find((a) => a.startsWith("--hotel-slug="));
  const slug = slugArg?.split("=")[1] ?? process.argv[process.argv.indexOf("--hotel-slug") + 1] ?? "local-hotel";

  const email = "restaurant@local-hotel.com";
  const password = "restaurant123";
  const employeeNumber = "7777";

  const [hotel] = await db.select().from(hotelsTable).where(eq(hotelsTable.slug, slug));
  if (!hotel) {
    console.error(`Hotel not found: ${slug}`);
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  if (existing) {
    await db
      .update(usersTable)
      .set({
        passwordHash,
        role: "personnel",
        staffDepartment: "RESTAURANT",
        employeeNumber,
        isActive: true,
        firstName: "Restaurant",
        lastName: "Staff",
      })
      .where(eq(usersTable.id, existing.id));
    console.log("Updated restaurant user");
  } else {
    await db.insert(usersTable).values({
      hotelId: hotel.id,
      email,
      passwordHash,
      provider: "local",
      role: "personnel",
      staffDepartment: "RESTAURANT",
      employeeNumber,
      isActive: true,
      firstName: "Restaurant",
      lastName: "Staff",
    });
    console.log("Created restaurant user");
  }

  console.log("\n=== RESTAURANT LOGIN ===");
  console.log(`URL:      /${hotel.slug}/restaurant-login`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
