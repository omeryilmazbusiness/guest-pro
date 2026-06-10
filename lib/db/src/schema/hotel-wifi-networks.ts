import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

export const hotelWifiNetworksTable = pgTable(
  "hotel_wifi_networks",
  {
    id: serial("id").primaryKey(),
    hotelId: integer("hotel_id")
      .references(() => hotelsTable.id, { onDelete: "cascade" })
      .notNull(),
    /** Wi-Fi network name (SSID) shown to guests */
    name: text("name").notNull(),
    wifiPassword: text("password").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique("hotel_wifi_networks_hotel_name").on(t.hotelId, t.name)],
);

export type HotelWifiNetwork = typeof hotelWifiNetworksTable.$inferSelect;
