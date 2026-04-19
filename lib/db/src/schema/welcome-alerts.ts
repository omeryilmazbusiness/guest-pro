import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

export const WELCOME_ALERT_STATUSES = ["open", "acknowledged"] as const;
export type WelcomeAlertStatus = (typeof WELCOME_ALERT_STATUSES)[number];

/**
 * Welcome-area support alerts — created anonymously from the public /welcoming screen.
 *
 * Intentionally separate from service_requests (which require an authenticated guest).
 * Staff see these in the manager dashboard as "Welcome Area" notifications.
 */
export const welcomeAlertsTable = pgTable("welcome_area_alerts", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  selectedLanguage: text("selected_language").notNull().default("en"),
  sessionId: text("session_id").notNull(),
  status: text("status").$type<WelcomeAlertStatus>().notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
});

export type WelcomeAlert = typeof welcomeAlertsTable.$inferSelect;
