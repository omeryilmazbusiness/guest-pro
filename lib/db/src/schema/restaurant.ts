import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";

// ---------------------------------------------------------------------------
// Menu item categories
// ---------------------------------------------------------------------------
export const MENU_CATEGORIES = [
  "BREAKFAST",
  "SOUP",
  "SALAD",
  "APPETIZER",
  "MAIN_COURSE",
  "DESSERT",
  "BEVERAGE",
  "SNACK",
  "OTHER",
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

// Menu type: "DAILY" = today's restaurant menu, "ROOM_SERVICE" = in-room ordering
export const MENU_TYPES = ["DAILY", "ROOM_SERVICE"] as const;
export type MenuType = (typeof MENU_TYPES)[number];

// ---------------------------------------------------------------------------
// restaurant_menu_items
// Represents a single dish/drink that the restaurant has published.
// menuType distinguishes daily menu from room-service menu.
// availableDate: ISO date string (YYYY-MM-DD) for DAILY items; null for ROOM_SERVICE.
// ---------------------------------------------------------------------------
export const restaurantMenuItemsTable = pgTable("restaurant_menu_items", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").$type<MenuCategory>().notNull().default("OTHER"),
  menuType: text("menu_type").$type<MenuType>().notNull().default("DAILY"),
  /** For DAILY items: the calendar date this item is available (YYYY-MM-DD).
   *  For ROOM_SERVICE items: null (always available while isActive). */
  availableDate: date("available_date"),
  /** Price in the hotel's local currency (stored as numeric string). */
  priceAmount: numeric("price_amount", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("TRY"),
  /** If false the item is hidden from guests immediately. */
  isActive: boolean("is_active").notNull().default(true),
  /** Free-text allergen / ingredient notes visible to guests. */
  allergenNotes: text("allergen_notes"),
  /** Calories or portion info. */
  portionInfo: text("portion_info"),
  /** Sort order within the same category. */
  sortOrder: integer("sort_order").notNull().default(0),
  createdByUserId: integer("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertRestaurantMenuItemSchema = createInsertSchema(
  restaurantMenuItemsTable
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertRestaurantMenuItem = z.infer<typeof insertRestaurantMenuItemSchema>;
export type RestaurantMenuItem = typeof restaurantMenuItemsTable.$inferSelect;

// ---------------------------------------------------------------------------
// restaurant_stock_items
// Simple stock ledger per hotel. The restaurant can bump quantities up/down.
// ---------------------------------------------------------------------------
export const restaurantStockItemsTable = pgTable("restaurant_stock_items", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("adet"),
  /** Current quantity on hand. */
  quantityOnHand: numeric("quantity_on_hand", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  /** Low-stock warning threshold. */
  lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale: 2 }).default(
    "5"
  ),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertRestaurantStockItemSchema = createInsertSchema(
  restaurantStockItemsTable
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertRestaurantStockItem = z.infer<typeof insertRestaurantStockItemSchema>;
export type RestaurantStockItem = typeof restaurantStockItemsTable.$inferSelect;

// ---------------------------------------------------------------------------
// restaurant_care_insights
// AI-generated, per-hotel, per-date actionable insight list for the restaurant
// derived from CARE_PROFILE_UPDATE service requests.
// Refreshed on demand (or automatically once per day).
// ---------------------------------------------------------------------------
export const restaurantCareInsightsTable = pgTable("restaurant_care_insights", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  /** The calendar date this analysis covers (YYYY-MM-DD). */
  date: date("date").notNull(),
  /**
   * Array of actionable insight strings, e.g.:
   *   ["Oda 101: Glutensiz seçenek sunun", "Oda 203: Şeker içermeyen tatlı hazırlayın"]
   */
  insights: jsonb("insights").$type<string[]>().notNull().default([]),
  /** How many care requests were analysed to produce these insights. */
  sourceRequestCount: integer("source_request_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RestaurantCareInsight = typeof restaurantCareInsightsTable.$inferSelect;
