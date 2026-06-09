import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { platformAdminsTable } from "./platform-admins";

/** Singleton row (id = 1) for platform-wide configuration. */
export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  verificationEmail: text("verification_email").notNull().default("ryilmazomer@gmail.com"),
  aiDefaultMonthlyTokenBudget: integer("ai_default_monthly_token_budget").notNull().default(100_000),
  aiStarterMonthlyBudget: integer("ai_starter_monthly_budget").notNull().default(50_000),
  aiGrowthMonthlyBudget: integer("ai_growth_monthly_budget").notNull().default(200_000),
  aiEnterpriseMonthlyBudget: integer("ai_enterprise_monthly_budget").notNull().default(1_000_000),
  aiDefaultMaxOutputTaskReport: integer("ai_default_max_output_task_report").notNull().default(800),
  aiDefaultMaxOutputDailySummary: integer("ai_default_max_output_daily_summary")
    .notNull()
    .default(1024),
  aiDefaultMaxOutputQuickReport: integer("ai_default_max_output_quick_report")
    .notNull()
    .default(1200),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  updatedBy: integer("updated_by").references(() => platformAdminsTable.id),
});

export type PlatformSettings = typeof platformSettingsTable.$inferSelect;
