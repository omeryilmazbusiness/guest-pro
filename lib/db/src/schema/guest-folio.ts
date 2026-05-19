import { pgTable, serial, text, timestamp, integer, numeric, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guestsTable } from "./guests";
import { hotelsTable } from "./hotels";
import { serviceRequestsTable } from "./service-requests";

export const FOLIO_CATEGORIES = ["FOOD", "ROOM_SERVICE", "MINIBAR", "OTHER"] as const;
export type FolioCategory = (typeof FOLIO_CATEGORIES)[number];

/**
 * Line-item charges posted to a guest folio (food orders, minibar, etc.).
 * One row per billable service request when price is known.
 */
export const guestFolioEntriesTable = pgTable(
  "guest_folio_entries",
  {
    id: serial("id").primaryKey(),
    guestId: integer("guest_id")
      .references(() => guestsTable.id)
      .notNull(),
    hotelId: integer("hotel_id")
      .references(() => hotelsTable.id)
      .notNull(),
    serviceRequestId: integer("service_request_id").references(() => serviceRequestsTable.id, {
      onDelete: "set null",
    }),
    /** Calendar date this charge belongs to (hotel-local day stored as UTC date string). */
    chargeDate: date("charge_date").notNull(),
    category: text("category").$type<FolioCategory>().notNull(),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmount: numeric("unit_amount", { precision: 10, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("TRY"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("guest_folio_service_request_uidx").on(table.serviceRequestId),
  ],
);

export const insertGuestFolioEntrySchema = createInsertSchema(guestFolioEntriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertGuestFolioEntry = z.infer<typeof insertGuestFolioEntrySchema>;
export type GuestFolioEntry = typeof guestFolioEntriesTable.$inferSelect;
