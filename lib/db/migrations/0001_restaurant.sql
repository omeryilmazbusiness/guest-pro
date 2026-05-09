CREATE TABLE "restaurant_menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'OTHER' NOT NULL,
	"menu_type" text DEFAULT 'DAILY' NOT NULL,
	"available_date" date,
	"price_amount" numeric(10, 2),
	"currency" text DEFAULT 'TRY' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"allergen_notes" text,
	"portion_info" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_stock_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'adet' NOT NULL,
	"quantity_on_hand" numeric(10, 2) DEFAULT '0' NOT NULL,
	"low_stock_threshold" numeric(10, 2) DEFAULT '5',
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_care_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"date" date NOT NULL,
	"insights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_request_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restaurant_menu_items" ADD CONSTRAINT "restaurant_menu_items_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "restaurant_stock_items" ADD CONSTRAINT "restaurant_stock_items_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "restaurant_care_insights" ADD CONSTRAINT "restaurant_care_insights_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;
