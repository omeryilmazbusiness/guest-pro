import { pgTable, serial, integer, text, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { hotelsTable } from "./hotels";

/** Empty string staffDepartment = hotel-wide insight (GM). */
export const dailyTaskInsightsTable = pgTable(
  "daily_task_insights",
  {
    id: serial("id").primaryKey(),
    hotelId: integer("hotel_id")
      .references(() => hotelsTable.id, { onDelete: "cascade" })
      .notNull(),
    staffDepartment: text("staff_department").notNull().default(""),
    date: text("date").notNull(),
    summary: text("summary").notNull(),
    finishedOnTime: jsonb("finished_on_time").$type<string[]>().notNull().default([]),
    finishedLate: jsonb("finished_late").$type<string[]>().notNull().default([]),
    notFinished: jsonb("not_finished").$type<string[]>().notNull().default([]),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    hotelDeptDateUid: uniqueIndex("daily_task_insights_hotel_dept_date_uidx").on(
      table.hotelId,
      table.staffDepartment,
      table.date,
    ),
  }),
);

export type DailyTaskInsight = typeof dailyTaskInsightsTable.$inferSelect;
