CREATE TABLE IF NOT EXISTS "guest_folio_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "guest_id" integer NOT NULL,
  "hotel_id" integer NOT NULL,
  "service_request_id" integer,
  "charge_date" date NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_amount" numeric(10, 2) NOT NULL,
  "line_total" numeric(10, 2) NOT NULL,
  "currency" text DEFAULT 'TRY' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest_folio_entries" ADD CONSTRAINT "guest_folio_entries_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "guest_folio_entries" ADD CONSTRAINT "guest_folio_entries_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "guest_folio_entries" ADD CONSTRAINT "guest_folio_entries_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "guest_folio_service_request_uidx" ON "guest_folio_entries" ("service_request_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guest_folio_guest_date_idx" ON "guest_folio_entries" ("guest_id", "charge_date");
