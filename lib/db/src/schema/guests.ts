import { pgTable, serial, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";

export const guestsTable = pgTable("guests", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  roomNumber: text("room_number").notNull(),
  countryCode: text("country_code").notNull().default("TR"),
  language: text("language").default("tr-TR"),
  isActive: boolean("is_active").notNull().default(true),

  // ── Stay dates ────────────────────────────────────────────────────────────
  // Stored as Postgres DATE (YYYY-MM-DD); drizzle serializes as string.
  // Nullable for backward-compatibility with guests created before this schema.
  checkInDate: date("check_in_date"),
  checkOutDate: date("check_out_date"),

  // ── Extension tracking ────────────────────────────────────────────────────
  // originalCheckOutDate: the checkout agreed at check-in, never modified.
  // Populated on the first extension (= previous checkOutDate).
  // isExtended / extensionCount: derived operational state stored explicitly
  // so staff can see "extended" status without re-deriving it from history.
  originalCheckOutDate: date("original_check_out_date"),
  isExtended: boolean("is_extended").notNull().default(false),
  extensionCount: integer("extension_count").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const guestKeysTable = pgTable("guest_keys", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").references(() => guestsTable.id).notNull(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyDisplay: text("key_display").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guestsTable.$inferSelect;

export const insertGuestKeySchema = createInsertSchema(guestKeysTable).omit({ id: true, createdAt: true });
export type InsertGuestKey = z.infer<typeof insertGuestKeySchema>;
export type GuestKey = typeof guestKeysTable.$inferSelect;

// ---------------------------------------------------------------------------
// Guest QR auto-login tokens
// ---------------------------------------------------------------------------
export const guestQrTokensTable = pgTable("guest_qr_tokens", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").references(() => guestsTable.id).notNull(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  issuedByUserId: integer("issued_by_user_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GuestQrToken = typeof guestQrTokensTable.$inferSelect;
