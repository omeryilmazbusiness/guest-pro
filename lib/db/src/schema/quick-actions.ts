import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";

export const quickActionsTable = pgTable("quick_actions", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  label: text("label").notNull(),
  icon: text("icon"),
  category: text("category").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuickActionSchema = createInsertSchema(quickActionsTable).omit({ id: true, createdAt: true });
export type InsertQuickAction = z.infer<typeof insertQuickActionSchema>;
export type QuickAction = typeof quickActionsTable.$inferSelect;
