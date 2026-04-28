import { db, hotelsTable, hotelBrandingTable, usersTable, guestsTable, guestKeysTable, quickActionsTable } from "@workspace/db";
import { hashPassword, generateGuestKey, generateSalt } from "./lib/auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existing = await db.select().from(hotelsTable).where(eq(hotelsTable.slug, "demo-hotel"));
  if (existing.length > 0) {
    console.log("Demo data already seeded. Skipping.");
    process.exit(0);
  }

  const [hotel] = await db
    .insert(hotelsTable)
    .values({ name: "The Grand Hotel", slug: "demo-hotel" })
    .returning();
  console.log(`Created hotel: ${hotel.name} (id: ${hotel.id})`);

  await db.insert(hotelBrandingTable).values({
    hotelId: hotel.id,
    appName: "Guest Pro",
    tagline: "Your personal hotel concierge",
    primaryColor: "#6366f1",
    accentColor: "#a855f7",
    welcomeText: "Welcome to The Grand Hotel! How can we make your stay exceptional today?",
  });

  const salt = generateSalt();
  const passwordHash = hashPassword("manager123", salt);
  await db.insert(usersTable).values({
    hotelId: hotel.id,
    email: "manager@grandhotel.com",
    passwordHash,
    provider: "local",
    role: "manager",
    firstName: "Hotel",
    lastName: "Manager",
  });
  console.log("Created manager: manager@grandhotel.com / manager123");

  const guest1 = await db.insert(guestsTable).values({
    hotelId: hotel.id,
    firstName: "Alice",
    lastName: "Johnson",
    roomNumber: "301",
    language: "en",
  }).returning();

  const { key: key1, keyHash: keyHash1 } = generateGuestKey();
  await db.insert(guestKeysTable).values({
    guestId: guest1[0].id,
    hotelId: hotel.id,
    keyHash: keyHash1,
    keyDisplay: key1,
  });
  console.log(`Created guest: Alice Johnson (Room 301) — key: ${key1}`);

  const guest2 = await db.insert(guestsTable).values({
    hotelId: hotel.id,
    firstName: "Carlos",
    lastName: "Rivera",
    roomNumber: "512",
    language: "en",
  }).returning();

  const { key: key2, keyHash: keyHash2 } = generateGuestKey();
  await db.insert(guestKeysTable).values({
    guestId: guest2[0].id,
    hotelId: hotel.id,
    keyHash: keyHash2,
    keyDisplay: key2,
  });
  console.log(`Created guest: Carlos Rivera (Room 512) — key: ${key2}`);

  await db.insert(quickActionsTable).values([
    { hotelId: hotel.id, label: "Reception", icon: "phone", category: "reception", sortOrder: 1 },
    { hotelId: hotel.id, label: "Activities", icon: "calendar", category: "activities", sortOrder: 2 },
  ]);

  console.log("\nSeed complete!");
  console.log("=== DEMO CREDENTIALS ===");
  console.log("Manager: manager@grandhotel.com / manager123");
  console.log(`Guest 1 key: ${key1}`);
  console.log(`Guest 2 key: ${key2}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
