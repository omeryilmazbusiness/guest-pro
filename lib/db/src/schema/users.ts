import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  provider: text("provider").notNull().default("local"),
  providerAccountId: text("provider_account_id"),
  role: text("role").notNull().default("manager"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
