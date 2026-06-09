import { pgTable, integer, text, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

/** GM-defined hotel pin for guest nearby map (separate from tracking geofence). */
export const hotelNearbySettingsTable = pgTable("hotel_nearby_settings", {
  hotelId: integer("hotel_id")
    .primaryKey()
    .references(() => hotelsTable.id, { onDelete: "cascade" }),
  hotelLat: doublePrecision("hotel_lat"),
  hotelLng: doublePrecision("hotel_lng"),
  hotelLabel: text("hotel_label"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type HotelNearbySettings = typeof hotelNearbySettingsTable.$inferSelect;
