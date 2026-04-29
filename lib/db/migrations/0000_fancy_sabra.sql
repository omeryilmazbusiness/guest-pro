CREATE TABLE "hotel_branding" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" serial NOT NULL,
	"app_name" text DEFAULT 'Guest Pro' NOT NULL,
	"tagline" text,
	"primary_color" text,
	"accent_color" text,
	"logo_url" text,
	"welcome_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"provider" text DEFAULT 'local' NOT NULL,
	"provider_account_id" text,
	"role" text DEFAULT 'manager' NOT NULL,
	"staff_department" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"first_name" text,
	"last_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "guest_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"key_hash" text NOT NULL,
	"key_display" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "guest_qr_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"issued_by_user_id" integer,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_qr_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"room_number" text NOT NULL,
	"country_code" text DEFAULT 'TR' NOT NULL,
	"language" text DEFAULT 'tr-TR',
	"is_active" boolean DEFAULT true NOT NULL,
	"check_in_date" date,
	"check_out_date" date,
	"original_check_out_date" date,
	"is_extended" boolean DEFAULT false NOT NULL,
	"extension_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"transferred_to" text,
	"context_summary" text,
	"summarized_message_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"original_content" text,
	"language" text,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"label" text NOT NULL,
	"icon" text,
	"category" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer,
	"actor_id" integer,
	"actor_type" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"date" text NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_presence_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"status" text DEFAULT 'UNKNOWN' NOT NULL,
	"last_lat" double precision,
	"last_lng" double precision,
	"last_accuracy_meters" double precision,
	"last_source_ip" text,
	"last_seen_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_presence_snapshots_guest_id_unique" UNIQUE("guest_id")
);
--> statement-breakpoint
CREATE TABLE "hotel_tracking_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"center_lat" double precision NOT NULL,
	"center_lng" double precision NOT NULL,
	"radius_meters" integer DEFAULT 100 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotel_tracking_configs_hotel_id_unique" UNIQUE("hotel_id")
);
--> statement-breakpoint
CREATE TABLE "hotel_tracking_networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"ip_or_cidr" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"hotel_id" integer NOT NULL,
	"room_number" text NOT NULL,
	"request_type" text NOT NULL,
	"summary" text NOT NULL,
	"structured_data" jsonb,
	"source_session_id" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"guest_first_name" text NOT NULL,
	"guest_last_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"date" text NOT NULL,
	"insights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "welcome_area_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"selected_language" text DEFAULT 'en' NOT NULL,
	"session_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "hotel_branding" ADD CONSTRAINT "hotel_branding_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_keys" ADD CONSTRAINT "guest_keys_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_keys" ADD CONSTRAINT "guest_keys_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_qr_tokens" ADD CONSTRAINT "guest_qr_tokens_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_qr_tokens" ADD CONSTRAINT "guest_qr_tokens_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_actions" ADD CONSTRAINT "quick_actions_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_presence_snapshots" ADD CONSTRAINT "guest_presence_snapshots_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_presence_snapshots" ADD CONSTRAINT "guest_presence_snapshots_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_tracking_configs" ADD CONSTRAINT "hotel_tracking_configs_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_tracking_networks" ADD CONSTRAINT "hotel_tracking_networks_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_source_session_id_chat_sessions_id_fk" FOREIGN KEY ("source_session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welcome_area_alerts" ADD CONSTRAINT "welcome_area_alerts_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;