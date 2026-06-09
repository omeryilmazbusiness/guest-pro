-- 0017: Idempotent backfill for migrations 0009–0012 that were skipped in production.
--
-- Root cause: 0009–0012 were inserted into the Drizzle journal after 0013–0016 had
-- already been applied, so the migrator never ran them on existing databases.
-- Safe to run on fresh DBs too (all statements are idempotent).

-- ── 0009: employee numbers + routine tasks ────────────────────────────────────

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employee_number" text;

CREATE UNIQUE INDEX IF NOT EXISTS "users_hotel_employee_number_idx"
  ON "users" ("hotel_id", "employee_number")
  WHERE "employee_number" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "routine_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "hotel_id" integer NOT NULL REFERENCES "hotels"("id"),
  "created_by_user_id" integer NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL,
  "description" text,
  "assignee_user_id" integer NOT NULL REFERENCES "users"("id"),
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "routine_tasks_hotel_idx" ON "routine_tasks" ("hotel_id");

ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "routine_task_id" integer;
ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "source_date" date;

CREATE UNIQUE INDEX IF NOT EXISTS "staff_tasks_routine_source_idx"
  ON "staff_tasks" ("routine_task_id", "source_date")
  WHERE "routine_task_id" IS NOT NULL;

-- ── 0010: routine_task_id FK with ON DELETE SET NULL ─────────────────────────

ALTER TABLE "staff_tasks" DROP CONSTRAINT IF EXISTS "staff_tasks_routine_task_id_fkey";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'staff_tasks_routine_task_id_fkey'
  ) THEN
    ALTER TABLE "staff_tasks"
      ADD CONSTRAINT "staff_tasks_routine_task_id_fkey"
      FOREIGN KEY ("routine_task_id") REFERENCES "routine_tasks"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── 0011: hotel AI budgets + platform_settings AI columns ─────────────────────

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

-- ── 0012: daily task insights ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_task_insights (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_department TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  summary TEXT NOT NULL,
  finished_on_time JSONB NOT NULL DEFAULT '[]'::jsonb,
  finished_late JSONB NOT NULL DEFAULT '[]'::jsonb,
  not_finished JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_task_insights_hotel_dept_date_uidx
  ON daily_task_insights (hotel_id, staff_department, date);

CREATE INDEX IF NOT EXISTS daily_task_insights_hotel_date_idx
  ON daily_task_insights (hotel_id, date);
