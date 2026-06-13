import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { guestsTable } from "./guests";
import { hotelsTable } from "./hotels";
import { usersTable } from "./users";

export const LIVE_CHAT_SESSION_STATUSES = ["active", "closed"] as const;
export type LiveChatSessionStatus = (typeof LIVE_CHAT_SESSION_STATUSES)[number];

export const LIVE_CHAT_SENDER_ROLES = ["guest", "staff", "system"] as const;
export type LiveChatSenderRole = (typeof LIVE_CHAT_SENDER_ROLES)[number];

export const liveChatSessionsTable = pgTable("live_chat_sessions", {
  id: serial("id").primaryKey(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  guestId: integer("guest_id")
    .references(() => guestsTable.id)
    .notNull(),
  status: text("status").$type<LiveChatSessionStatus>().notNull().default("active"),
  emergencyAt: timestamp("emergency_at", { withTimezone: true }),
  emergencyAcknowledgedAt: timestamp("emergency_acknowledged_at", { withTimezone: true }),
  staffTypingUntil: timestamp("staff_typing_until", { withTimezone: true }),
  guestTranslatingUntil: timestamp("guest_translating_until", { withTimezone: true }),
  lastGuestUiLocale: text("last_guest_ui_locale"),
  lastStaffUiLocale: text("last_staff_ui_locale"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const LIVE_CHAT_MESSAGE_TYPES = ["text", "location"] as const;
export type LiveChatMessageType = (typeof LIVE_CHAT_MESSAGE_TYPES)[number];

export const liveChatMessagesTable = pgTable("live_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => liveChatSessionsTable.id)
    .notNull(),
  senderRole: text("sender_role").$type<LiveChatSenderRole>().notNull(),
  messageType: text("message_type").$type<LiveChatMessageType>().notNull().default("text"),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  staffUserId: integer("staff_user_id").references(() => usersTable.id),
  /** Sender's original text. */
  content: text("content").notNull(),
  /** Translated text for the recipient (staff sees guest msgs translated; guest sees staff msgs translated). */
  translatedContent: text("translated_content"),
  /** BCP-47 / ISO language code that translatedContent was generated for. */
  translatedForLang: text("translated_for_lang"),
  language: text("language"),
  /** AI summary for reception — what the guest wants. */
  aiInsight: text("ai_insight"),
  readByStaffAt: timestamp("read_by_staff_at", { withTimezone: true }),
  readByGuestAt: timestamp("read_by_guest_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLiveChatSessionSchema = createInsertSchema(liveChatSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLiveChatSession = z.infer<typeof insertLiveChatSessionSchema>;
export type LiveChatSession = typeof liveChatSessionsTable.$inferSelect;

export const insertLiveChatMessageSchema = createInsertSchema(liveChatMessagesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLiveChatMessage = z.infer<typeof insertLiveChatMessageSchema>;
export type LiveChatMessage = typeof liveChatMessagesTable.$inferSelect;

export const LIVE_CHAT_EMERGENCY_SEVERITIES = ["critical", "warning"] as const;
export type LiveChatEmergencySeverity = (typeof LIVE_CHAT_EMERGENCY_SEVERITIES)[number];

export const liveChatEmergencyEventsTable = pgTable("live_chat_emergency_events", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => liveChatSessionsTable.id)
    .notNull(),
  hotelId: integer("hotel_id")
    .references(() => hotelsTable.id)
    .notNull(),
  guestId: integer("guest_id")
    .references(() => guestsTable.id)
    .notNull(),
  /** Client-generated idempotency key — duplicate POST returns the same event. */
  clientEventId: text("client_event_id"),
  severity: text("severity").$type<LiveChatEmergencySeverity>().notNull().default("critical"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
});

export type LiveChatEmergencyEvent = typeof liveChatEmergencyEventsTable.$inferSelect;
