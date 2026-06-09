CREATE TABLE IF NOT EXISTS hotel_floor_wifi (
  id serial PRIMARY KEY,
  hotel_id integer NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  floor_key text NOT NULL,
  floor_label text NOT NULL,
  wifi_password text NOT NULL,
  wifi_ssid text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hotel_floor_wifi_hotel_floor_key UNIQUE (hotel_id, floor_key)
);

CREATE INDEX IF NOT EXISTS hotel_floor_wifi_hotel_id_idx ON hotel_floor_wifi (hotel_id);
