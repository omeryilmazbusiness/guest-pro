ALTER TABLE "live_chat_emergency_events"
  ADD COLUMN IF NOT EXISTS "client_event_id" text;

CREATE UNIQUE INDEX IF NOT EXISTS "live_chat_emergency_events_guest_client_id_idx"
  ON "live_chat_emergency_events" ("guest_id", "client_event_id")
  WHERE "client_event_id" IS NOT NULL;
