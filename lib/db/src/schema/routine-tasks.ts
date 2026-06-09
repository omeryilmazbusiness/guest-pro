import { pgTable, serial, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";
import { usersTable } from "./users";

export const routineTasksTable = pgTable(
  "routine_tasks",
  {
    id: serial("id").primaryKey(),
    hotelId: integer("hotel_id")
      .references(() => hotelsTable.id)
      .notNull(),
    createdByUserId: integer("created_by_user_id")
      .references(() => usersTable.id)
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    assigneeUserId: integer("assignee_user_id")
      .references(() => usersTable.id)
      .notNull(),
    /** Daily start time in HH:MM (UTC). */
    startTime: text("start_time").notNull(),
    /** Daily end time in HH:MM (UTC). */
    endTime: text("end_time").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("routine_tasks_hotel_idx").on(table.hotelId)],
);

export const insertRoutineTaskSchema = createInsertSchema(routineTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRoutineTask = z.infer<typeof insertRoutineTaskSchema>;
export type RoutineTask = typeof routineTasksTable.$inferSelect;
