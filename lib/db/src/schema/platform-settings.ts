import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { platformAdminsTable } from "./platform-admins";

/** Singleton row (id = 1) for platform-wide configuration. */
export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  verificationEmail: text("verification_email").notNull().default("ryilmazomer@gmail.com"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  updatedBy: integer("updated_by").references(() => platformAdminsTable.id),
});

export type PlatformSettings = typeof platformSettingsTable.$inferSelect;
