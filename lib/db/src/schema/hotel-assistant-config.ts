import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

/** Facility checkbox entry (pool, spa wing, aquapark, etc.). */
export interface HotelAmenityConfig {
  id: string;
  enabled: boolean;
  openTime?: string;
  closeTime?: string;
  reservationPhone?: string;
  notes?: string;
}

export const hotelAssistantConfigsTable = pgTable("hotel_assistant_configs", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  aboutHotel: text("about_hotel").notNull().default(""),
  cityName: text("city_name"),
  countryCode: text("country_code"),
  amenities: jsonb("amenities").$type<HotelAmenityConfig[]>().notNull().default([]),
  taxiLobbyPhone: text("taxi_lobby_phone"),
  taxiNotes: text("taxi_notes"),
  spaPhone: text("spa_phone"),
  spaInfo: text("spa_info"),
  spaOpenTime: text("spa_open_time"),
  spaCloseTime: text("spa_close_time"),
  salonInfo: text("salon_info"),
  salonPhone: text("salon_phone"),
  salonOpenTime: text("salon_open_time"),
  salonCloseTime: text("salon_close_time"),
  laundryInfo: text("laundry_info"),
  laundryPhone: text("laundry_phone"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type HotelAssistantConfig = typeof hotelAssistantConfigsTable.$inferSelect;
