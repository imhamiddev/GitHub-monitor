CREATE TABLE "telegram_chat_pref" (
	"chat_id" text PRIMARY KEY NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_group" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"chat_type" text NOT NULL,
	"title" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_milestone" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"reached_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"repository_name" text,
	"event_type" text NOT NULL,
	"action" text,
	"actor_login" text,
	"summary" jsonb NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "telegram_group" ADD CONSTRAINT "telegram_group_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_milestone" ADD CONSTRAINT "telegram_milestone_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_outbox" ADD CONSTRAINT "telegram_outbox_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_group_chat_id_idx" ON "telegram_group" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "telegram_group_user_id_idx" ON "telegram_group" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_milestone_user_key_idx" ON "telegram_milestone" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "telegram_outbox_user_claimed_idx" ON "telegram_outbox" USING btree ("user_id","claimed_at");