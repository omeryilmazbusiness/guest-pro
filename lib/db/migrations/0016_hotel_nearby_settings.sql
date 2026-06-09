CREATE TABLE IF NOT EXISTS hotel_nearby_settings (
  hotel_id integer PRIMARY KEY REFERENCES hotels(id) ON DELETE CASCADE,
  hotel_lat double precision,
  hotel_lng double precision,
  hotel_label text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
