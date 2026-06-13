ALTER TABLE "guest_entry_track_schedules"
  ADD COLUMN IF NOT EXISTS "guest_prompted_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "guest_acknowledged_at" timestamptz;

ALTER TABLE "live_chat_emergency_events"
  ADD COLUMN IF NOT EXISTS "severity" text NOT NULL DEFAULT 'critical';
