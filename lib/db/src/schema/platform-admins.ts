import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Platform operators (super admins) — not bound to a single hotel.
 * Hotel staff remain in usersTable with hotel_id.
 */
export const platformAdminsTable = pgTable("platform_admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlatformAdminSchema = createInsertSchema(platformAdminsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlatformAdmin = z.infer<typeof insertPlatformAdminSchema>;
export type PlatformAdmin = typeof platformAdminsTable.$inferSelect;
