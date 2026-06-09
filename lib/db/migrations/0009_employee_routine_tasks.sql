-- Employee numbers for staff portal login + recurring routine task templates

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

ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "routine_task_id" integer REFERENCES "routine_tasks"("id");
ALTER TABLE "staff_tasks" ADD COLUMN IF NOT EXISTS "source_date" date;

CREATE UNIQUE INDEX IF NOT EXISTS "staff_tasks_routine_source_idx"
  ON "staff_tasks" ("routine_task_id", "source_date")
  WHERE "routine_task_id" IS NOT NULL;
