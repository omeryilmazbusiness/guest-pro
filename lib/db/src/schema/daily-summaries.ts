import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

export const dailySummariesTable = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  date: text("date").notNull(),
  insights: jsonb("insights").$type<string[]>().notNull().default([]),
  recommendations: jsonb("recommendations").$type<string[]>().notNull().default([]),
  metricsSnapshot: jsonb("metrics_snapshot").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DailySummary = typeof dailySummariesTable.$inferSelect;
