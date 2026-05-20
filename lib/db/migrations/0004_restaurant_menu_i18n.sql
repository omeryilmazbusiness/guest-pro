ALTER TABLE "restaurant_menu_items"
  ADD COLUMN IF NOT EXISTS "name_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL;

ALTER TABLE "restaurant_menu_items"
  ADD COLUMN IF NOT EXISTS "description_i18n" jsonb DEFAULT '{}'::jsonb NOT NULL;

