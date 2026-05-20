/**
 * Create (or update) department manager accounts for local/dev.
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=../../.env pnpm exec tsx scripts/create-department-managers.ts
 *   DOTENV_CONFIG_PATH=../../.env pnpm exec tsx scripts/create-department-managers.ts --hotel-slug demo-hotel
 */
import "dotenv/config";
import { db, hotelsTable, usersTable } from "@workspace/db";
import type { StaffDepartment } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { hashPassword, generateSalt } from "../src/lib/auth";

const DEFAULT_PASSWORD = "DeptMgr2026!";

const DEPARTMENT_MANAGERS: {
  department: StaffDepartment;
  email: string;
  firstName: string;
  lastName: string;
}[] = [
  {
    department: "HOUSEKEEPING",
    email: "housekeeping.manager@grandhotel.com",
    firstName: "Ayşe",
    lastName: "Demir",
  },
  {
    department: "BELLMAN",
    email: "bellman.manager@grandhotel.com",
    firstName: "Mehmet",
    lastName: "Kaya",
  },
  {
    department: "RESTAURANT",
    email: "restaurant.manager@grandhotel.com",
    firstName: "Elif",
    lastName: "Yıldız",
  },
];

async function resolveHotelId(): Promise<number> {
  const slugArg = process.argv.find((a) => a.startsWith("--hotel-slug="))?.split("=")[1];
  if (slugArg) {
    const [hotel] = await db
      .select({ id: hotelsTable.id })
      .from(hotelsTable)
      .where(eq(hotelsTable.slug, slugArg))
      .limit(1);
    if (!hotel) throw new Error(`Hotel not found for slug: ${slugArg}`);
    return hotel.id;
  }

  const [hotel] = await db.select({ id: hotelsTable.id }).from(hotelsTable).limit(1);
  if (!hotel) throw new Error("No hotel in database. Run seed or create-hotel first.");
  return hotel.id;
}

async function upsertDepartmentManager(
  hotelId: number,
  profile: (typeof DEPARTMENT_MANAGERS)[number],
  password: string,
): Promise<"created" | "updated"> {
  const email = profile.email.toLowerCase();
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(usersTable)
      .set({
        hotelId,
        role: "manager",
        staffDepartment: profile.department,
        firstName: profile.firstName,
        lastName: profile.lastName,
        passwordHash,
        isActive: true,
        provider: "local",
      })
      .where(eq(usersTable.id, existing.id));
    return "updated";
  }

  await db.insert(usersTable).values({
    hotelId,
    email,
    passwordHash,
    provider: "local",
    role: "manager",
    staffDepartment: profile.department,
    firstName: profile.firstName,
    lastName: profile.lastName,
    isActive: true,
  });
  return "created";
}

async function main() {
  const hotelId = await resolveHotelId();
  const password = process.env.DEPT_MANAGER_PASSWORD ?? DEFAULT_PASSWORD;

  console.log(`Hotel id: ${hotelId}`);
  console.log(`Password: ${password}\n`);

  const results: { department: string; email: string; action: string }[] = [];

  for (const profile of DEPARTMENT_MANAGERS) {
    const action = await upsertDepartmentManager(hotelId, profile, password);
    results.push({
      department: profile.department,
      email: profile.email,
      action,
    });
    console.log(`${action === "created" ? "✓ Created" : "↻ Updated"} ${profile.department}: ${profile.email}`);
  }

  console.log("\n=== DEPARTMENT MANAGER LOGIN ===");
  console.log("Manager login tab → email + password below:\n");
  for (const r of results) {
    console.log(`  ${r.department.padEnd(14)} ${r.email.padEnd(42)} ${password}`);
  }
  console.log("\nDashboard: /manager (Team + Tasks only, no Guests)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
