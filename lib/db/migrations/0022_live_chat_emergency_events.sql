CREATE TABLE IF NOT EXISTS "live_chat_emergency_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "session_id" integer NOT NULL REFERENCES "live_chat_sessions"("id"),
  "hotel_id" integer NOT NULL REFERENCES "hotels"("id"),
  "guest_id" integer NOT NULL REFERENCES "guests"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "acknowledged_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "live_chat_emergency_events_hotel_pending_idx"
  ON "live_chat_emergency_events" ("hotel_id", "acknowledged_at", "created_at");

ALTER TABLE "live_chat_messages"
  ADD COLUMN IF NOT EXISTS "translated_for_lang" text;
