import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";
import { guestsTable } from "./guests";
import { liveChatSessionsTable } from "./live-chat";

export const guestEntryTrackSchedulesTable = pgTable("guest_entry_track_schedules", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  guestId: integer("guest_id")
    .references(() => guestsTable.id)
    .notNull(),
  sessionId: integer("session_id").references(() => liveChatSessionsTable.id),
  expectedEntryAt: timestamp("expected_entry_at", { withTimezone: true }).notNull(),
  guestPromptedAt: timestamp("guest_prompted_at", { withTimezone: true }),
  guestAcknowledgedAt: timestamp("guest_acknowledged_at", { withTimezone: true }),
  alertTriggeredAt: timestamp("alert_triggered_at", { withTimezone: true }),
  emergencyEventId: integer("emergency_event_id"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type GuestEntryTrackSchedule = typeof guestEntryTrackSchedulesTable.$inferSelect;
