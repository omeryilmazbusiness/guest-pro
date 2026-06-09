-- Per-hotel AI token budgets and monthly usage tracking.

CREATE TABLE IF NOT EXISTS hotel_ai_configs (
  id serial PRIMARY KEY,
  hotel_id integer NOT NULL UNIQUE REFERENCES hotels(id) ON DELETE CASCADE,
  monthly_token_budget integer,
  max_output_tokens_task_report integer,
  max_output_tokens_daily_summary integer,
  max_output_tokens_quick_report integer,
  task_reports_enabled boolean NOT NULL DEFAULT true,
  daily_summaries_enabled boolean NOT NULL DEFAULT true,
  quick_reports_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotel_ai_usage (
  id serial PRIMARY KEY,
  hotel_id integer NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  period_key text NOT NULL,
  tokens_used integer NOT NULL DEFAULT 0,
  request_count integer NOT NULL DEFAULT 0,
  task_report_tokens integer NOT NULL DEFAULT 0,
  daily_summary_tokens integer NOT NULL DEFAULT 0,
  quick_report_tokens integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, period_key)
);

CREATE INDEX IF NOT EXISTS hotel_ai_usage_hotel_period_idx ON hotel_ai_usage (hotel_id, period_key);

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS ai_default_monthly_token_budget integer NOT NULL DEFAULT 100000;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS ai_starter_monthly_budget integer NOT NULL DEFAULT 50000;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS ai_growth_monthly_budget integer NOT NULL DEFAULT 200000;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS ai_enterprise_monthly_budget integer NOT NULL DEFAULT 1000000;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS ai_default_max_output_task_report integer NOT NULL DEFAULT 800;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS ai_default_max_output_daily_summary integer NOT NULL DEFAULT 1024;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS ai_default_max_output_quick_report integer NOT NULL DEFAULT 1200;
