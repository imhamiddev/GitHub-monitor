CREATE TABLE "telegram_connection" (
	"user_id" text PRIMARY KEY NOT NULL,
	"link_token_hash" text,
	"link_token_expires_at" timestamp,
	"chat_id" text,
	"telegram_username" text,
	"telegram_first_name" text,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_connection" ADD CONSTRAINT "telegram_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_connection_link_token_idx" ON "telegram_connection" USING btree ("link_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_connection_chat_id_idx" ON "telegram_connection" USING btree ("chat_id");