import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hotelsTable = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const hotelBrandingTable = pgTable("hotel_branding", {
  id: serial("id").primaryKey(),
  hotelId: serial("hotel_id").references(() => hotelsTable.id).notNull(),
  appName: text("app_name").notNull().default("Guest Pro"),
  tagline: text("tagline"),
  primaryColor: text("primary_color"),
  accentColor: text("accent_color"),
  logoUrl: text("logo_url"),
  welcomeText: text("welcome_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHotelSchema = createInsertSchema(hotelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotelsTable.$inferSelect;

export const insertHotelBrandingSchema = createInsertSchema(hotelBrandingTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHotelBranding = z.infer<typeof insertHotelBrandingSchema>;
export type HotelBranding = typeof hotelBrandingTable.$inferSelect;
