CREATE TABLE IF NOT EXISTS hotel_nearby_places (
  id serial PRIMARY KEY,
  hotel_id integer NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  type text NOT NULL,
  description text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hotel_nearby_places_hotel_id_idx ON hotel_nearby_places (hotel_id);
