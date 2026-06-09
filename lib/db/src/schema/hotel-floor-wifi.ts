import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

export const hotelFloorWifiTable = pgTable("hotel_floor_wifi", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id, { onDelete: "cascade" })
    .notNull(),
  /** Match key derived from room number (e.g. "3", "12", "G") */
  floorKey: text("floor_key").notNull(),
  /** Human-readable label shown to guests (e.g. "3rd Floor", "Kat 3") */
  floorLabel: text("floor_label").notNull(),
  wifiPassword: text("wifi_password").notNull(),
  wifiSsid: text("wifi_ssid"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type HotelFloorWifi = typeof hotelFloorWifiTable.$inferSelect;
