import { pgTable, uuid, integer, text, timestamp } from "drizzle-orm/pg-core";
import { platformAdminsTable } from "./platform-admins";

export const platformLoginChallengesTable = pgTable("platform_login_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => platformAdminsTable.id),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformLoginChallenge = typeof platformLoginChallengesTable.$inferSelect;
