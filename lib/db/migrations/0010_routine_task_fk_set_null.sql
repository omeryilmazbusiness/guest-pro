-- Allow routine task templates to be deleted while keeping generated staff_tasks rows.

ALTER TABLE "staff_tasks" DROP CONSTRAINT IF EXISTS "staff_tasks_routine_task_id_fkey";

ALTER TABLE "staff_tasks"
  ADD CONSTRAINT "staff_tasks_routine_task_id_fkey"
  FOREIGN KEY ("routine_task_id") REFERENCES "routine_tasks"("id")
  ON DELETE SET NULL;
