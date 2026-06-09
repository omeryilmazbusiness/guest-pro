-- Daily task performance insight (one per hotel + department per day, generated at 18:00)
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
