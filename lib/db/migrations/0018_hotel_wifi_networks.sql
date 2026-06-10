-- 0018: Replace floor-based Wi-Fi with guest-assigned Wi-Fi networks.

CREATE TABLE IF NOT EXISTS hotel_wifi_networks (
  id serial PRIMARY KEY,
  hotel_id integer NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  password text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hotel_wifi_networks_hotel_name UNIQUE (hotel_id, name)
);

CREATE INDEX IF NOT EXISTS hotel_wifi_networks_hotel_id_idx ON hotel_wifi_networks (hotel_id);

-- Migrate legacy floor Wi-Fi rows when the old table still exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hotel_floor_wifi'
  ) AND NOT EXISTS (SELECT 1 FROM hotel_wifi_networks LIMIT 1) THEN
    INSERT INTO hotel_wifi_networks (hotel_id, name, password, sort_order, created_at, updated_at)
    SELECT
      fw.hotel_id,
      COALESCE(
        NULLIF(TRIM(fw.wifi_ssid), ''),
        NULLIF(TRIM(fw.floor_label), ''),
        'Wi-Fi ' || fw.id::text
      ),
      fw.wifi_password,
      fw.sort_order,
      fw.created_at,
      fw.updated_at
    FROM hotel_floor_wifi fw;
  END IF;
END $$;

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS wifi_network_id integer REFERENCES hotel_wifi_networks(id) ON DELETE SET NULL;

DROP TABLE IF EXISTS hotel_floor_wifi;
