CREATE TABLE IF NOT EXISTS "live_chat_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "hotel_id" integer NOT NULL REFERENCES "hotels"("id"),
  "guest_id" integer NOT NULL REFERENCES "guests"("id"),
  "status" text DEFAULT 'active' NOT NULL,
  "emergency_at" timestamp with time zone,
  "emergency_acknowledged_at" timestamp with time zone,
  "staff_typing_until" timestamp with time zone,
  "last_message_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "live_chat_sessions_hotel_status_idx"
  ON "live_chat_sessions" ("hotel_id", "status");

CREATE INDEX IF NOT EXISTS "live_chat_sessions_guest_active_idx"
  ON "live_chat_sessions" ("guest_id", "status");

CREATE TABLE IF NOT EXISTS "live_chat_messages" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" integer NOT NULL REFERENCES "live_chat_sessions"("id"),
  "sender_role" text NOT NULL,
  "staff_user_id" integer REFERENCES "users"("id"),
  "content" text NOT NULL,
  "translated_content" text,
  "language" text,
  "ai_insight" text,
  "read_by_staff_at" timestamp with time zone,
  "read_by_guest_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "live_chat_messages_session_idx"
  ON "live_chat_messages" ("session_id", "created_at");
