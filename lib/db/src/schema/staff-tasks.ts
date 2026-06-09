import { pgTable, serial, text, timestamp, integer, index, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";
import { usersTable } from "./users";
import { routineTasksTable } from "./routine-tasks";

export const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const staffTasksTable = pgTable(
  "staff_tasks",
  {
    id: serial("id").primaryKey(),
    hotelId: integer("hotel_id")
      .references(() => hotelsTable.id)
      .notNull(),
    assigneeUserId: integer("assignee_user_id")
      .references(() => usersTable.id)
      .notNull(),
    createdByUserId: integer("created_by_user_id")
      .references(() => usersTable.id)
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }).notNull(),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }).notNull(),
    status: text("status").$type<TaskStatus>().notNull().default("pending"),
    routineTaskId: integer("routine_task_id").references(() => routineTasksTable.id, {
      onDelete: "set null",
    }),
    /** Calendar day this instance was generated from a routine template. */
    sourceDate: date("source_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("staff_tasks_hotel_start_idx").on(table.hotelId, table.scheduledStartAt),
    index("staff_tasks_assignee_start_idx").on(table.assigneeUserId, table.scheduledStartAt),
  ],
);

export const insertStaffTaskSchema = createInsertSchema(staffTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertStaffTask = z.infer<typeof insertStaffTaskSchema>;
export type StaffTask = typeof staffTasksTable.$inferSelect;
