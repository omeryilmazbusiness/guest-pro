CREATE TABLE IF NOT EXISTS "hotel_assistant_configs" (
  "id" serial PRIMARY KEY NOT NULL,
  "hotel_id" integer NOT NULL UNIQUE REFERENCES "hotels"("id") ON DELETE CASCADE,
  "about_hotel" text DEFAULT '' NOT NULL,
  "city_name" text,
  "amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "taxi_lobby_phone" text,
  "taxi_notes" text,
  "spa_phone" text,
  "spa_info" text,
  "spa_open_time" text,
  "spa_close_time" text,
  "salon_info" text,
  "salon_phone" text,
  "salon_open_time" text,
  "salon_close_time" text,
  "laundry_info" text,
  "laundry_phone" text,
  "onboarding_completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Backfill one config row per existing hotel (amenities merged at runtime).
INSERT INTO hotel_assistant_configs (hotel_id, amenities)
SELECT h.id, '[]'::jsonb
FROM hotels h
WHERE NOT EXISTS (
  SELECT 1 FROM hotel_assistant_configs c WHERE c.hotel_id = h.id
);
