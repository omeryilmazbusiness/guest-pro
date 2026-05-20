CREATE TABLE IF NOT EXISTS "staff_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "hotel_id" integer NOT NULL,
  "assignee_user_id" integer NOT NULL,
  "created_by_user_id" integer NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "scheduled_start_at" timestamp with time zone NOT NULL,
  "scheduled_end_at" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_tasks_hotel_start_idx" ON "staff_tasks" ("hotel_id", "scheduled_start_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_tasks_assignee_start_idx" ON "staff_tasks" ("assignee_user_id", "scheduled_start_at");
