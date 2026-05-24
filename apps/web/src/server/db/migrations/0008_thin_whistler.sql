CREATE TYPE "public"."auth_session_invalidation_reason" AS ENUM('logout', 'membership_removed', 'role_changed', 'security_event', 'provider_revoked', 'expired', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."auth_session_status" AS ENUM('active', 'expired', 'revoked', 'invalidated', 'archived');--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_reference_hash" varchar(128) NOT NULL,
	"provider_session_id" varchar(160),
	"status" "auth_session_status" DEFAULT 'active' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_verified_at" timestamp with time zone,
	"invalidated_reason" "auth_session_invalidation_reason",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_reference_hash_unique" ON "auth_sessions" USING btree ("session_reference_hash");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_status_idx" ON "auth_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_provider_session_idx" ON "auth_sessions" USING btree ("provider_session_id");