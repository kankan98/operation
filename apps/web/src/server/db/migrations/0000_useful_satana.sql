CREATE TYPE "public"."idempotency_status" AS ENUM('pending', 'completed', 'conflict', 'expired');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('invited', 'active', 'suspended', 'removed', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."permission_scope" AS ENUM('tenant', 'team', 'own_records');--> statement-breakpoint
CREATE TYPE "public"."role_permission" AS ENUM('read_workspace', 'manage_products', 'capture_session', 'review_knowledge', 'run_ai_review', 'ask_qa', 'manage_talk_tracks', 'manage_next_tasks', 'manage_members', 'export_data', 'admin_settings');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('operator', 'host', 'product_owner', 'reviewer', 'admin', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('active', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."team_type" AS ENUM('live_operations', 'product_team', 'review_team', 'admin_team');--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('owner', 'admin', 'member', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."app_user_status" AS ENUM('active', 'pending', 'suspended', 'deleted');--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"primary_email" varchar(320) NOT NULL,
	"status" "app_user_status" DEFAULT 'pending' NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"actor_id" text,
	"tenant_id" text,
	"team_id" text,
	"target_type" varchar(80),
	"target_id" text,
	"request_id" varchar(120) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" varchar(160) NOT NULL,
	"request_hash" varchar(128) NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"target_type" varchar(80),
	"target_id" text,
	"status" "idempotency_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "team_role" NOT NULL,
	"permission" "role_permission" NOT NULL,
	"scope" "permission_scope" DEFAULT 'team' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "membership_status" DEFAULT 'invited' NOT NULL,
	"role" "team_role" DEFAULT 'viewer' NOT NULL,
	"permission_overrides" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"joined_at" timestamp with time zone,
	"last_role_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" varchar(160) NOT NULL,
	"team_type" "team_type" DEFAULT 'live_operations' NOT NULL,
	"status" "team_status" DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "membership_status" DEFAULT 'invited' NOT NULL,
	"tenant_role" "tenant_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL,
	"default_team_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_audit_events" ADD CONSTRAINT "data_audit_events_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_audit_events" ADD CONSTRAINT "data_audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_audit_events" ADD CONSTRAINT "data_audit_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_primary_email_unique" ON "app_users" USING btree ("primary_email");--> statement-breakpoint
CREATE INDEX "app_users_status_idx" ON "app_users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "data_audit_events_tenant_team_idx" ON "data_audit_events" USING btree ("tenant_id","team_id");--> statement-breakpoint
CREATE INDEX "data_audit_events_actor_id_idx" ON "data_audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "data_audit_events_target_idx" ON "data_audit_events" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "data_audit_events_request_id_idx" ON "data_audit_events" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "data_audit_events_created_at_idx" ON "data_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_records_scope_key_unique" ON "idempotency_records" USING btree ("tenant_id","team_id","actor_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idempotency_records_tenant_team_status_idx" ON "idempotency_records" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idempotency_records_target_idx" ON "idempotency_records" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_permission_scope_unique" ON "role_permissions" USING btree ("role","permission","scope");--> statement-breakpoint
CREATE INDEX "role_permissions_role_active_idx" ON "role_permissions" USING btree ("role","active");--> statement-breakpoint
CREATE INDEX "team_memberships_tenant_id_idx" ON "team_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "team_memberships_team_id_idx" ON "team_memberships" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_memberships_user_id_idx" ON "team_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_memberships_team_status_idx" ON "team_memberships" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "team_memberships_team_role_idx" ON "team_memberships" USING btree ("team_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "team_memberships_team_user_unique" ON "team_memberships" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "teams_tenant_id_idx" ON "teams" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "teams_tenant_status_idx" ON "teams" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_tenant_name_unique" ON "teams" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_id_idx" ON "tenant_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_id_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_status_idx" ON "tenant_memberships" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_tenant_user_unique" ON "tenant_memberships" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tenants_default_team_id_idx" ON "tenants" USING btree ("default_team_id");