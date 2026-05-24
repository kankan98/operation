CREATE TYPE "public"."knowledge_claim_review_state" AS ENUM('pending', 'approved', 'rejected', 'conflict', 'needs_source');--> statement-breakpoint
CREATE TYPE "public"."knowledge_claim_type" AS ENUM('racket_spec', 'platform_rule', 'sales_guidance', 'customer_question', 'objection_reply', 'metric_definition', 'team_experience');--> statement-breakpoint
CREATE TYPE "public"."knowledge_confidence" AS ENUM('high', 'medium', 'low', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."knowledge_conflict_resolution_state" AS ENUM('open', 'reviewing', 'resolved', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."knowledge_conflict_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."knowledge_conflict_type" AS ENUM('spec_mismatch', 'rule_change', 'source_priority', 'team_note_conflict', 'stale_source');--> statement-breakpoint
CREATE TYPE "public"."knowledge_extraction_method" AS ENUM('manual', 'ai_candidate', 'imported');--> statement-breakpoint
CREATE TYPE "public"."knowledge_language" AS ENUM('zh', 'en', 'mixed', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."knowledge_refresh_cadence" AS ENUM('manual', 'monthly', 'quarterly', 'on_demand');--> statement-breakpoint
CREATE TYPE "public"."knowledge_review_decision" AS ENUM('approve', 'reject', 'request_source', 'mark_conflict', 'mark_stale', 'publish', 'archive');--> statement-breakpoint
CREATE TYPE "public"."knowledge_review_target_type" AS ENUM('source', 'claim', 'team_note', 'conflict', 'ai_finding', 'feedback_signal');--> statement-breakpoint
CREATE TYPE "public"."knowledge_sensitive_level" AS ENUM('internal', 'restricted', 'high');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_review_state" AS ENUM('registered', 'extracting', 'reviewing', 'approved', 'rejected', 'stale', 'conflict', 'archived');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_type" AS ENUM('official_brand', 'official_platform', 'official_sport_rule', 'authorized_retailer', 'academic_research', 'team_note', 'web_discovery');--> statement-breakpoint
CREATE TYPE "public"."knowledge_trust_level" AS ENUM('official', 'authorized', 'research', 'team', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."published_knowledge_status" AS ENUM('published', 'stale', 'superseded', 'conflict_blocked', 'archived');--> statement-breakpoint
CREATE TYPE "public"."team_knowledge_note_type" AS ENUM('selling_experience', 'talk_track', 'objection_reply', 'after_sales', 'pricing_guidance', 'workflow_note');--> statement-breakpoint
CREATE TYPE "public"."team_knowledge_review_state" AS ENUM('draft', 'reviewing', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TABLE "extracted_knowledge_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"source_id" text NOT NULL,
	"claim_type" "knowledge_claim_type" NOT NULL,
	"subject" varchar(240) NOT NULL,
	"knowledge_key" varchar(260) NOT NULL,
	"claim_text" text NOT NULL,
	"language" "knowledge_language" DEFAULT 'unknown' NOT NULL,
	"confidence" "knowledge_confidence" DEFAULT 'unknown' NOT NULL,
	"extraction_method" "knowledge_extraction_method" DEFAULT 'manual' NOT NULL,
	"review_state" "knowledge_claim_review_state" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_conflicts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"knowledge_key" varchar(260) NOT NULL,
	"claim_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conflict_type" "knowledge_conflict_type" NOT NULL,
	"severity" "knowledge_conflict_severity" DEFAULT 'medium' NOT NULL,
	"resolution_state" "knowledge_conflict_resolution_state" DEFAULT 'open' NOT NULL,
	"resolution_decision_id" text,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_review_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"target_type" "knowledge_review_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"decision" "knowledge_review_decision" NOT NULL,
	"reason" varchar(600) NOT NULL,
	"reviewed_by" text NOT NULL,
	"request_id" varchar(120) NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"source_type" "knowledge_source_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"owner" varchar(160) NOT NULL,
	"url" varchar(2048) DEFAULT '' NOT NULL,
	"normalized_source_key" varchar(360) NOT NULL,
	"retrieved_at" timestamp with time zone NOT NULL,
	"trust_level" "knowledge_trust_level" DEFAULT 'unknown' NOT NULL,
	"review_state" "knowledge_source_review_state" DEFAULT 'registered' NOT NULL,
	"refresh_cadence" "knowledge_refresh_cadence" DEFAULT 'manual' NOT NULL,
	"intended_use" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_checked_at" timestamp with time zone,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_knowledge_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"knowledge_key" varchar(260) NOT NULL,
	"version" integer NOT NULL,
	"status" "published_knowledge_status" DEFAULT 'published' NOT NULL,
	"summary" text NOT NULL,
	"claim_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"team_note_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_by" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_knowledge_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"note_type" "team_knowledge_note_type" NOT NULL,
	"knowledge_key" varchar(260) NOT NULL,
	"content" text NOT NULL,
	"sensitive_level" "knowledge_sensitive_level" DEFAULT 'internal' NOT NULL,
	"review_state" "team_knowledge_review_state" DEFAULT 'draft' NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extracted_knowledge_claims" ADD CONSTRAINT "extracted_knowledge_claims_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_knowledge_claims" ADD CONSTRAINT "extracted_knowledge_claims_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_knowledge_claims" ADD CONSTRAINT "extracted_knowledge_claims_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_knowledge_claims" ADD CONSTRAINT "extracted_knowledge_claims_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_knowledge_claims" ADD CONSTRAINT "extracted_knowledge_claims_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_knowledge_claims" ADD CONSTRAINT "extracted_knowledge_claims_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_conflicts" ADD CONSTRAINT "knowledge_conflicts_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_review_decisions" ADD CONSTRAINT "knowledge_review_decisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_review_decisions" ADD CONSTRAINT "knowledge_review_decisions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_review_decisions" ADD CONSTRAINT "knowledge_review_decisions_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_knowledge_versions" ADD CONSTRAINT "published_knowledge_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_knowledge_versions" ADD CONSTRAINT "published_knowledge_versions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_knowledge_versions" ADD CONSTRAINT "published_knowledge_versions_published_by_app_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_knowledge_notes" ADD CONSTRAINT "team_knowledge_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_knowledge_notes" ADD CONSTRAINT "team_knowledge_notes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_knowledge_notes" ADD CONSTRAINT "team_knowledge_notes_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_knowledge_notes" ADD CONSTRAINT "team_knowledge_notes_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_knowledge_notes" ADD CONSTRAINT "team_knowledge_notes_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_claims_source_idx" ON "extracted_knowledge_claims" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_claims_tenant_team_review_idx" ON "extracted_knowledge_claims" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE INDEX "knowledge_claims_tenant_team_key_idx" ON "extracted_knowledge_claims" USING btree ("tenant_id","team_id","knowledge_key");--> statement-breakpoint
CREATE INDEX "knowledge_claims_tenant_team_type_idx" ON "extracted_knowledge_claims" USING btree ("tenant_id","team_id","claim_type");--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_tenant_team_state_idx" ON "knowledge_conflicts" USING btree ("tenant_id","team_id","resolution_state");--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_tenant_team_key_idx" ON "knowledge_conflicts" USING btree ("tenant_id","team_id","knowledge_key");--> statement-breakpoint
CREATE INDEX "knowledge_conflicts_tenant_team_severity_idx" ON "knowledge_conflicts" USING btree ("tenant_id","team_id","severity");--> statement-breakpoint
CREATE INDEX "knowledge_review_decisions_target_idx" ON "knowledge_review_decisions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "knowledge_review_decisions_tenant_team_reviewed_at_idx" ON "knowledge_review_decisions" USING btree ("tenant_id","team_id","reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_sources_scope_key_unique" ON "knowledge_sources" USING btree ("tenant_id","team_id","normalized_source_key");--> statement-breakpoint
CREATE INDEX "knowledge_sources_tenant_team_review_idx" ON "knowledge_sources" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE INDEX "knowledge_sources_tenant_team_trust_idx" ON "knowledge_sources" USING btree ("tenant_id","team_id","trust_level");--> statement-breakpoint
CREATE INDEX "knowledge_sources_tenant_team_checked_idx" ON "knowledge_sources" USING btree ("tenant_id","team_id","last_checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "published_knowledge_scope_key_version_unique" ON "published_knowledge_versions" USING btree ("tenant_id","team_id","knowledge_key","version");--> statement-breakpoint
CREATE INDEX "published_knowledge_tenant_team_status_idx" ON "published_knowledge_versions" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "published_knowledge_tenant_team_key_idx" ON "published_knowledge_versions" USING btree ("tenant_id","team_id","knowledge_key");--> statement-breakpoint
CREATE INDEX "team_knowledge_notes_tenant_team_review_idx" ON "team_knowledge_notes" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE INDEX "team_knowledge_notes_tenant_team_key_idx" ON "team_knowledge_notes" USING btree ("tenant_id","team_id","knowledge_key");--> statement-breakpoint
CREATE INDEX "team_knowledge_notes_tenant_team_type_idx" ON "team_knowledge_notes" USING btree ("tenant_id","team_id","note_type");