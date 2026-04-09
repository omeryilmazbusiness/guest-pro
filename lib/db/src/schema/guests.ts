import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
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
//   - Raw token is 32 random bytes (hex) — never stored in DB
//   - DB only stores SHA-256(rawToken) so a DB breach doesn't expose usable tokens
//   - Single-use: usedAt is set when consumed; subsequent attempts are rejected
//   - 24-hour expiry from issuance
//   - Revoked by staff when they regenerate a QR for the same guest
// ---------------------------------------------------------------------------
export const guestQrTokensTable = pgTable("guest_qr_tokens", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").references(() => guestsTable.id).notNull(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  /** SHA-256 hash of the raw token — raw token never stored */
  tokenHash: text("token_hash").notNull().unique(),
  issuedByUserId: integer("issued_by_user_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GuestQrToken = typeof guestQrTokensTable.$inferSelect;
