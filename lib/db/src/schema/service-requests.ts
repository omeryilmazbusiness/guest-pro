import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guestsTable } from "./guests";
import { hotelsTable } from "./hotels";
import { chatSessionsTable } from "./chat";

export const SERVICE_REQUEST_TYPES = [
  "FOOD_ORDER",
  "SUPPORT_REQUEST",
  "CARE_PROFILE_UPDATE",
  "GENERAL_SERVICE_REQUEST",
] as const;

export type ServiceRequestType = (typeof SERVICE_REQUEST_TYPES)[number];

export const SERVICE_REQUEST_STATUSES = ["open", "in_progress", "resolved"] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const serviceRequestsTable = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").references(() => guestsTable.id).notNull(),
  hotelId: integer("hotel_id").references(() => hotelsTable.id).notNull(),
  roomNumber: text("room_number").notNull(),
  requestType: text("request_type").$type<ServiceRequestType>().notNull(),
  summary: text("summary").notNull(),
  structuredData: jsonb("structured_data"),
  sourceSessionId: integer("source_session_id").references(() => chatSessionsTable.id),
  status: text("status").$type<ServiceRequestStatus>().notNull().default("open"),
  guestFirstName: text("guest_first_name").notNull(),
  guestLastName: text("guest_last_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;
