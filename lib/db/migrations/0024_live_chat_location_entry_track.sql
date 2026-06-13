ALTER TABLE "live_chat_messages" ADD COLUMN IF NOT EXISTS "message_type" text NOT NULL DEFAULT 'text';
ALTER TABLE "live_chat_messages" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

CREATE TABLE IF NOT EXISTS "guest_entry_track_schedules" (
  "id" serial PRIMARY KEY NOT NULL,
  "hotel_id" integer NOT NULL REFERENCES "hotels"("id"),
  "guest_id" integer NOT NULL REFERENCES "guests"("id"),
  "session_id" integer REFERENCES "live_chat_sessions"("id"),
  "expected_entry_at" timestamp with time zone NOT NULL,
  "alert_triggered_at" timestamp with time zone,
  "emergency_event_id" integer,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "guest_entry_track_schedules_due_idx"
  ON "guest_entry_track_schedules" ("expected_entry_at")
  WHERE "alert_triggered_at" IS NULL AND "cancelled_at" IS NULL;
