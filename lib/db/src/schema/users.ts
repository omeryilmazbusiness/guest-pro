import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hotelsTable } from "./hotels";

// ---------------------------------------------------------------------------
// Staff department classification — secondary classification for "personnel".
// Managers have staffDepartment = null.
// ---------------------------------------------------------------------------
export const STAFF_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "RECEPTION",
  "RESTAURANT",
  "KITCHEN",
  "FINANCIAL_ACCOUNTING",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "SPA_GYM",
] as const;

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  HOUSEKEEPING: "Housekeeping",
  BELLMAN: "Bellman",
  RECEPTION: "Reception",
  RESTAURANT: "Restaurant",
  KITCHEN: "Kitchen",
  FINANCIAL_ACCOUNTING: "Financial & Accounting",
  SECURITY: "Security",
  MAINTENANCE: "Maintenance",
  MARKETING: "Marketing",
  SPA_GYM: "Spa & Gym",
};

/** Departments that can have a department manager (manager + staffDepartment). */
export const DEPARTMENT_MANAGER_DEPARTMENTS = [
  "HOUSEKEEPING",
  "BELLMAN",
  "RECEPTION",
  "KITCHEN",
  "FINANCIAL_ACCOUNTING",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "SPA_GYM",
] as const satisfies readonly StaffDepartment[];

export type DepartmentManagerDepartment = (typeof DEPARTMENT_MANAGER_DEPARTMENTS)[number];

// ---------------------------------------------------------------------------
// Users table — hotel staff (managers and personnel)
// ---------------------------------------------------------------------------
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  provider: text("provider").notNull().default("local"),
  providerAccountId: text("provider_account_id"),
  /** Top-level role: "manager" | "personnel". Guests live in guestsTable. */
  role: text("role").notNull().default("manager"),
  /**
   * Department for personnel users (null for managers and OAuth accounts).
   * Allowed: HOUSEKEEPING | BELLMAN | RECEPTION | RESTAURANT
   */
  staffDepartment: text("staff_department").$type<StaffDepartment>(),
  /**
   * Soft-disable flag.  Inactive personnel cannot log in.
   * Managers should only be deactivated with care.
   */
  isActive: boolean("is_active").notNull().default(true),
  firstName: text("first_name"),
  lastName: text("last_name"),
  /** 4-digit employee number — unique per hotel; used for staff portal login. */
  employeeNumber: text("employee_number"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
