import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

/** Per-hotel AI limits (platform-managed). Null budget = plan/platform default. */
export const hotelAiConfigsTable = pgTable("hotel_ai_configs", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  monthlyTokenBudget: integer("monthly_token_budget"),
  maxOutputTokensTaskReport: integer("max_output_tokens_task_report"),
  maxOutputTokensDailySummary: integer("max_output_tokens_daily_summary"),
  maxOutputTokensQuickReport: integer("max_output_tokens_quick_report"),
  taskReportsEnabled: boolean("task_reports_enabled").notNull().default(true),
  dailySummariesEnabled: boolean("daily_summaries_enabled").notNull().default(true),
  quickReportsEnabled: boolean("quick_reports_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Monthly rollup of Gemini token consumption per hotel. */
export const hotelAiUsageTable = pgTable("hotel_ai_usage", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id, { onDelete: "cascade" })
    .notNull(),
  periodKey: text("period_key").notNull(),
  tokensUsed: integer("tokens_used").notNull().default(0),
  requestCount: integer("request_count").notNull().default(0),
  taskReportTokens: integer("task_report_tokens").notNull().default(0),
  dailySummaryTokens: integer("daily_summary_tokens").notNull().default(0),
  quickReportTokens: integer("quick_report_tokens").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type HotelAiConfig = typeof hotelAiConfigsTable.$inferSelect;
export type HotelAiUsage = typeof hotelAiUsageTable.$inferSelect;
