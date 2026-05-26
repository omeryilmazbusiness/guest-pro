CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "verification_email" text NOT NULL DEFAULT 'ryilmazomer@gmail.com',
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_by" integer
);

INSERT INTO "platform_settings" ("id", "verification_email")
VALUES (1, 'ryilmazomer@gmail.com')
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "platform_login_challenges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" integer NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "platform_login_challenges_admin_id_idx"
  ON "platform_login_challenges" ("admin_id");

CREATE INDEX IF NOT EXISTS "platform_login_challenges_expires_at_idx"
  ON "platform_login_challenges" ("expires_at");
