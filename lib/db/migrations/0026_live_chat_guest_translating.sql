ALTER TABLE "live_chat_sessions" ADD COLUMN IF NOT EXISTS "guest_translating_until" timestamp with time zone;
ALTER TABLE "live_chat_sessions" ADD COLUMN IF NOT EXISTS "last_staff_ui_locale" text;
