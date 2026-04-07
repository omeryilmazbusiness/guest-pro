import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { guestsTable } from "./guests";

export const dailyUsageTable = pgTable("daily_usage", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").references(() => guestsTable.id).notNull(),
  date: text("date").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DailyUsage = typeof dailyUsageTable.$inferSelect;
