CREATE TYPE "public"."customer_objection_resolved_state" AS ENUM('resolved', 'partially_resolved', 'unresolved', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."customer_objection_type" AS ENUM('price', 'skill_level', 'too_stiff', 'too_head_heavy', 'durability', 'similar_owned', 'trust', 'other');--> statement-breakpoint
CREATE TYPE "public"."customer_question_topic" AS ENUM('fit', 'tension', 'weight', 'balance', 'price', 'durability', 'comparison', 'after_sales', 'other');--> statement-breakpoint
CREATE TYPE "public"."customer_sensitive_redaction_state" AS ENUM('not_needed', 'redacted', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."session_capture_status" AS ENUM('draft', 'autosaved', 'submitted', 'review_ready', 'processing', 'processed', 'failed', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."session_evidence_state" AS ENUM('linked_product', 'manual_only', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."session_host_role" AS ENUM('host', 'assistant', 'operator', 'product_specialist', 'reviewer');--> statement-breakpoint
CREATE TYPE "public"."session_note_source" AS ENUM('manual', 'transcript_excerpt', 'operator_summary');--> statement-breakpoint
CREATE TYPE "public"."session_note_type" AS ENUM('opening', 'product_explanation', 'customer_question', 'objection', 'deal_signal', 'gap', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."session_platform" AS ENUM('douyin', 'kuaishou', 'video_account', 'offline_notes', 'other');--> statement-breakpoint
CREATE TYPE "public"."session_product_role" AS ENUM('opening_compare', 'main_offer', 'objection_bridge', 'alternative', 'closing_push');--> statement-breakpoint
CREATE TYPE "public"."session_review_state" AS ENUM('unreviewed', 'reviewed', 'needs_clarification');--> statement-breakpoint
CREATE TYPE "public"."session_source_mode" AS ENUM('manual', 'transcript_import', 'mixed');--> statement-breakpoint
CREATE TABLE "customer_objections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text NOT NULL,
	"objection_type" "customer_objection_type" DEFAULT 'other' NOT NULL,
	"content" text NOT NULL,
	"response_used" text DEFAULT '' NOT NULL,
	"resolved_state" "customer_objection_resolved_state" DEFAULT 'unknown' NOT NULL,
	"follow_up_needed" boolean DEFAULT false NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text NOT NULL,
	"question_text" text NOT NULL,
	"topic" "customer_question_topic" DEFAULT 'other' NOT NULL,
	"related_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer_given" text DEFAULT '' NOT NULL,
	"needs_knowledge" boolean DEFAULT false NOT NULL,
	"sensitive_redaction_state" "customer_sensitive_redaction_state" DEFAULT 'not_needed' NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_session_captures" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"title" varchar(240) NOT NULL,
	"normalized_title" varchar(240) NOT NULL,
	"session_label_key" varchar(320) NOT NULL,
	"session_date" timestamp with time zone NOT NULL,
	"platform" "session_platform" NOT NULL,
	"status" "session_capture_status" DEFAULT 'draft' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"source_mode" "session_source_mode" DEFAULT 'manual' NOT NULL,
	"draft_version" integer DEFAULT 1 NOT NULL,
	"sensitive_redaction_state" "customer_sensitive_redaction_state" DEFAULT 'not_needed' NOT NULL,
	"last_autosaved_at" timestamp with time zone,
	"submitted_by" text,
	"submitted_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_host_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"display_name" varchar(120) NOT NULL,
	"role" "session_host_role" NOT NULL,
	"responsibility" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text NOT NULL,
	"note_type" "session_note_type" NOT NULL,
	"content" text NOT NULL,
	"source" "session_note_source" DEFAULT 'manual' NOT NULL,
	"sequence" integer NOT NULL,
	"review_state" "session_review_state" DEFAULT 'unreviewed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_product_order" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text NOT NULL,
	"racket_product_id" text,
	"display_model" varchar(180) NOT NULL,
	"order_index" integer NOT NULL,
	"role_in_session" "session_product_role" NOT NULL,
	"talking_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"customer_fit" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_state" "session_evidence_state" DEFAULT 'manual_only' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_objections" ADD CONSTRAINT "customer_objections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_objections" ADD CONSTRAINT "customer_objections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_objections" ADD CONSTRAINT "customer_objections_session_id_live_session_captures_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_session_captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_questions" ADD CONSTRAINT "customer_questions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_questions" ADD CONSTRAINT "customer_questions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_questions" ADD CONSTRAINT "customer_questions_session_id_live_session_captures_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_session_captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_captures" ADD CONSTRAINT "live_session_captures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_captures" ADD CONSTRAINT "live_session_captures_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_captures" ADD CONSTRAINT "live_session_captures_submitted_by_app_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_captures" ADD CONSTRAINT "live_session_captures_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_captures" ADD CONSTRAINT "live_session_captures_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_host_roles" ADD CONSTRAINT "session_host_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_host_roles" ADD CONSTRAINT "session_host_roles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_host_roles" ADD CONSTRAINT "session_host_roles_session_id_live_session_captures_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_session_captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_host_roles" ADD CONSTRAINT "session_host_roles_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_session_id_live_session_captures_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_session_captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_product_order" ADD CONSTRAINT "session_product_order_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_product_order" ADD CONSTRAINT "session_product_order_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_product_order" ADD CONSTRAINT "session_product_order_session_id_live_session_captures_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_session_captures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_product_order" ADD CONSTRAINT "session_product_order_racket_product_id_racket_products_id_fk" FOREIGN KEY ("racket_product_id") REFERENCES "public"."racket_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_objections_session_sequence_unique" ON "customer_objections" USING btree ("session_id","sequence");--> statement-breakpoint
CREATE INDEX "customer_objections_session_idx" ON "customer_objections" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "customer_objections_tenant_team_type_idx" ON "customer_objections" USING btree ("tenant_id","team_id","objection_type");--> statement-breakpoint
CREATE INDEX "customer_objections_tenant_team_follow_up_idx" ON "customer_objections" USING btree ("tenant_id","team_id","follow_up_needed");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_questions_session_sequence_unique" ON "customer_questions" USING btree ("session_id","sequence");--> statement-breakpoint
CREATE INDEX "customer_questions_session_idx" ON "customer_questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "customer_questions_tenant_team_topic_idx" ON "customer_questions" USING btree ("tenant_id","team_id","topic");--> statement-breakpoint
CREATE INDEX "customer_questions_tenant_team_needs_knowledge_idx" ON "customer_questions" USING btree ("tenant_id","team_id","needs_knowledge");--> statement-breakpoint
CREATE UNIQUE INDEX "session_captures_scope_label_unique" ON "live_session_captures" USING btree ("tenant_id","team_id","session_label_key");--> statement-breakpoint
CREATE INDEX "session_captures_tenant_team_status_idx" ON "live_session_captures" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "session_captures_tenant_team_date_idx" ON "live_session_captures" USING btree ("tenant_id","team_id","session_date");--> statement-breakpoint
CREATE INDEX "session_captures_tenant_team_created_at_idx" ON "live_session_captures" USING btree ("tenant_id","team_id","created_at");--> statement-breakpoint
CREATE INDEX "session_host_roles_session_idx" ON "session_host_roles" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_host_roles_tenant_team_role_idx" ON "session_host_roles" USING btree ("tenant_id","team_id","role");--> statement-breakpoint
CREATE INDEX "session_host_roles_user_id_idx" ON "session_host_roles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_notes_session_sequence_unique" ON "session_notes" USING btree ("session_id","sequence");--> statement-breakpoint
CREATE INDEX "session_notes_session_idx" ON "session_notes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_notes_tenant_team_type_idx" ON "session_notes" USING btree ("tenant_id","team_id","note_type");--> statement-breakpoint
CREATE INDEX "session_notes_tenant_team_review_idx" ON "session_notes" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE UNIQUE INDEX "session_product_order_session_order_unique" ON "session_product_order" USING btree ("session_id","order_index");--> statement-breakpoint
CREATE INDEX "session_product_order_session_idx" ON "session_product_order" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_product_order_racket_idx" ON "session_product_order" USING btree ("racket_product_id");--> statement-breakpoint
CREATE INDEX "session_product_order_tenant_team_idx" ON "session_product_order" USING btree ("tenant_id","team_id");