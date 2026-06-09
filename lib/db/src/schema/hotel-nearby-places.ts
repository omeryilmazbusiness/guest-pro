import { pgTable, serial, integer, text, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

export const hotelNearbyPlacesTable = pgTable("hotel_nearby_places", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  address: text("address"),
  /** market | pharmacy | bazaar | mall | restaurant | other */
  type: text("type").notNull(),
  description: text("description"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type HotelNearbyPlace = typeof hotelNearbyPlacesTable.$inferSelect;
