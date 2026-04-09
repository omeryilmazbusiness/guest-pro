import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";
import { guestsTable } from "./guests";

// ---------------------------------------------------------------------------
// Hotel Tracking Configuration
// One config per hotel. Holds geofence centre and tracking toggle.
// ---------------------------------------------------------------------------
export const hotelTrackingConfigsTable = pgTable("hotel_tracking_configs", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull()
    .unique(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  centerLat: doublePrecision("center_lat").notNull(),
  centerLng: doublePrecision("center_lng").notNull(),
  radiusMeters: integer("radius_meters").notNull().default(100),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// Allowed Hotel Networks
// One row per IP / CIDR range.  Multiple rows per hotel.
// ---------------------------------------------------------------------------
export const hotelTrackingNetworksTable = pgTable("hotel_tracking_networks", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  ipOrCidr: text("ip_or_cidr").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Guest Presence Snapshots
// Latest known presence state per guest.  Upserted on each heartbeat.
// ---------------------------------------------------------------------------
export const guestPresenceSnapshotsTable = pgTable(
  "guest_presence_snapshots",
  {
    id: serial("id").primaryKey(),
    guestId: integer("guest_id")
      .references(() => guestsTable.id)
      .notNull()
      .unique(),
    hotelId: integer("hotel_id")
      .references(() => hotelsTable.id)
      .notNull(),
    status: text("status").notNull().default("UNKNOWN"),
    lastLat: doublePrecision("last_lat"),
    lastLng: doublePrecision("last_lng"),
    lastAccuracyMeters: doublePrecision("last_accuracy_meters"),
    lastSourceIp: text("last_source_ip"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }
);

export type HotelTrackingConfig =
  typeof hotelTrackingConfigsTable.$inferSelect;
export type HotelTrackingNetwork =
  typeof hotelTrackingNetworksTable.$inferSelect;
export type GuestPresenceSnapshot =
  typeof guestPresenceSnapshotsTable.$inferSelect;
