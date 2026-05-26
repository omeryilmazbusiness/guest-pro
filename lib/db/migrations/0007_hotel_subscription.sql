ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "plan_tier" text DEFAULT 'starter' NOT NULL;
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "subscription_renews_at" timestamp with time zone;
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "platform_notes" text;
