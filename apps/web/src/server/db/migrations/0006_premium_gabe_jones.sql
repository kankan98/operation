CREATE TYPE "public"."talk_track_asset_type" AS ENUM('product_intro', 'feature_benefit', 'comparison', 'objection_reply', 'closing_prompt', 'short_video_hook', 'transition', 'qa_reply');--> statement-breakpoint
CREATE TYPE "public"."talk_track_candidate_review_state" AS ENUM('pending', 'accepted', 'edited', 'rejected', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."talk_track_candidate_source" AS ENUM('ai_review', 'session_capture', 'manual', 'qa_feedback');--> statement-breakpoint
CREATE TYPE "public"."talk_track_conflict_state" AS ENUM('none', 'needs_review', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."talk_track_freshness_state" AS ENUM('current', 'stale_warning', 'stale_blocked', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."talk_track_host_role" AS ENUM('host', 'assistant', 'operator');--> statement-breakpoint
CREATE TYPE "public"."talk_track_language" AS ENUM('zh_CN', 'mixed_zh_en');--> statement-breakpoint
CREATE TYPE "public"."talk_track_live_scene" AS ENUM('opening', 'product_demo', 'comparison', 'objection_handling', 'closing', 'short_video', 'qa');--> statement-breakpoint
CREATE TYPE "public"."talk_track_objection_type" AS ENUM('price', 'beginner_fit', 'durability', 'weight', 'stiffness', 'string_tension', 'authenticity', 'comparison', 'after_sales');--> statement-breakpoint
CREATE TYPE "public"."talk_track_owner_role" AS ENUM('operator', 'host', 'product_owner', 'reviewer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."talk_track_play_style" AS ENUM('control', 'attack', 'defense', 'doubles', 'singles', 'all_round', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."talk_track_player_level" AS ENUM('beginner', 'intermediate', 'advanced', 'professional', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."talk_track_price_band" AS ENUM('entry', 'mid', 'premium', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."talk_track_reply_strategy" AS ENUM('clarify_need', 'compare_options', 'explain_tradeoff', 'recommend_alternative', 'defer_to_review');--> statement-breakpoint
CREATE TYPE "public"."talk_track_review_decision" AS ENUM('approve', 'approve_with_edits', 'reject', 'request_changes', 'deprecate');--> statement-breakpoint
CREATE TYPE "public"."talk_track_risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."talk_track_segment_type" AS ENUM('hook', 'product_fact', 'benefit', 'demo_step', 'comparison_point', 'objection_reply', 'cta', 'transition');--> statement-breakpoint
CREATE TYPE "public"."talk_track_sensitive_redaction_state" AS ENUM('not_needed', 'redacted', 'needs_review', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."talk_track_source_type" AS ENUM('racket_product_version', 'knowledge_version', 'session_example', 'ai_review_run', 'team_experience');--> statement-breakpoint
CREATE TYPE "public"."talk_track_status" AS ENUM('draft', 'reviewing', 'published', 'deprecated', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."talk_track_tone" AS ENUM('professional', 'friendly', 'urgent', 'educational', 'comparison');--> statement-breakpoint
CREATE TYPE "public"."talk_track_usage_signal" AS ENUM('used', 'edited_before_use', 'rejected_in_use', 'reported_wrong', 'needs_update');--> statement-breakpoint
CREATE TYPE "public"."talk_track_usage_workflow" AS ENUM('live_session', 'ai_review', 'qa_answer', 'short_video', 'manual');--> statement-breakpoint
CREATE TYPE "public"."talk_track_validation_state" AS ENUM('unchecked', 'passed', 'warning', 'blocked');--> statement-breakpoint
CREATE TABLE "talk_track_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_type" "talk_track_asset_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"normalized_title" varchar(240) NOT NULL,
	"status" "talk_track_status" DEFAULT 'draft' NOT NULL,
	"owner_role" "talk_track_owner_role" NOT NULL,
	"current_version_id" text DEFAULT '' NOT NULL,
	"scenario_fingerprint" varchar(360) NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"archived_by" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_id" text,
	"version_id" text,
	"candidate_source" "talk_track_candidate_source" NOT NULL,
	"ai_run_id" varchar(180) DEFAULT '' NOT NULL,
	"ai_section_id" varchar(180) DEFAULT '' NOT NULL,
	"prompt_version" varchar(180) DEFAULT '' NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"knowledge_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"racket_product_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scenario_fingerprint" varchar(360) DEFAULT '' NOT NULL,
	"proposed_body" text NOT NULL,
	"validation_state" "talk_track_validation_state" DEFAULT 'unchecked' NOT NULL,
	"review_state" "talk_track_candidate_review_state" DEFAULT 'pending' NOT NULL,
	"sensitive_redaction_state" "talk_track_sensitive_redaction_state" DEFAULT 'not_needed' NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_objection_patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"objection_type" "talk_track_objection_type" NOT NULL,
	"customer_question_example" text DEFAULT '' NOT NULL,
	"reply_strategy" "talk_track_reply_strategy" NOT NULL,
	"risk_level" "talk_track_risk_level" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_review_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"version_id" text NOT NULL,
	"decision" "talk_track_review_decision" NOT NULL,
	"reason" varchar(600) NOT NULL,
	"edited_body" text DEFAULT '' NOT NULL,
	"reviewed_by" text NOT NULL,
	"request_id" varchar(120) NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"racket_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"player_level" "talk_track_player_level" DEFAULT 'unknown' NOT NULL,
	"play_style" "talk_track_play_style" DEFAULT 'unknown' NOT NULL,
	"price_band" "talk_track_price_band" DEFAULT 'unknown' NOT NULL,
	"live_scene" "talk_track_live_scene" NOT NULL,
	"host_role" "talk_track_host_role" DEFAULT 'host' NOT NULL,
	"objection_type" "talk_track_objection_type",
	"usage_constraints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scenario_fingerprint" varchar(360) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_segments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"version_id" text NOT NULL,
	"segment_type" "talk_track_segment_type" NOT NULL,
	"text" text NOT NULL,
	"required_evidence" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_source_groundings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"version_id" text NOT NULL,
	"source_type" "talk_track_source_type" NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"knowledge_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"racket_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_run_id" varchar(180) DEFAULT '' NOT NULL,
	"freshness_state" "talk_track_freshness_state" DEFAULT 'unknown' NOT NULL,
	"conflict_state" "talk_track_conflict_state" DEFAULT 'none' NOT NULL,
	"sensitive_redaction_state" "talk_track_sensitive_redaction_state" DEFAULT 'not_needed' NOT NULL,
	"claim_summary" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_usage_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"version_id" text NOT NULL,
	"source_workflow" "talk_track_usage_workflow" NOT NULL,
	"signal_type" "talk_track_usage_signal" NOT NULL,
	"reason" varchar(600) NOT NULL,
	"actor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_track_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"version" integer NOT NULL,
	"status" "talk_track_status" DEFAULT 'draft' NOT NULL,
	"body" text NOT NULL,
	"tone" "talk_track_tone" DEFAULT 'professional' NOT NULL,
	"language" "talk_track_language" DEFAULT 'zh_CN' NOT NULL,
	"review_decision_id" text DEFAULT '' NOT NULL,
	"source_grounding_id" text DEFAULT '' NOT NULL,
	"candidate_id" text DEFAULT '' NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"published_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "talk_track_assets" ADD CONSTRAINT "talk_track_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_assets" ADD CONSTRAINT "talk_track_assets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_assets" ADD CONSTRAINT "talk_track_assets_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_assets" ADD CONSTRAINT "talk_track_assets_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_assets" ADD CONSTRAINT "talk_track_assets_archived_by_app_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_candidates" ADD CONSTRAINT "talk_track_candidates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_candidates" ADD CONSTRAINT "talk_track_candidates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_candidates" ADD CONSTRAINT "talk_track_candidates_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_candidates" ADD CONSTRAINT "talk_track_candidates_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_objection_patterns" ADD CONSTRAINT "talk_track_objection_patterns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_objection_patterns" ADD CONSTRAINT "talk_track_objection_patterns_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_objection_patterns" ADD CONSTRAINT "talk_track_objection_patterns_asset_id_talk_track_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."talk_track_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_review_decisions" ADD CONSTRAINT "talk_track_review_decisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_review_decisions" ADD CONSTRAINT "talk_track_review_decisions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_review_decisions" ADD CONSTRAINT "talk_track_review_decisions_asset_id_talk_track_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."talk_track_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_review_decisions" ADD CONSTRAINT "talk_track_review_decisions_version_id_talk_track_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."talk_track_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_review_decisions" ADD CONSTRAINT "talk_track_review_decisions_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_scenarios" ADD CONSTRAINT "talk_track_scenarios_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_scenarios" ADD CONSTRAINT "talk_track_scenarios_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_scenarios" ADD CONSTRAINT "talk_track_scenarios_asset_id_talk_track_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."talk_track_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_segments" ADD CONSTRAINT "talk_track_segments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_segments" ADD CONSTRAINT "talk_track_segments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_segments" ADD CONSTRAINT "talk_track_segments_version_id_talk_track_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."talk_track_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_source_groundings" ADD CONSTRAINT "talk_track_source_groundings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_source_groundings" ADD CONSTRAINT "talk_track_source_groundings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_source_groundings" ADD CONSTRAINT "talk_track_source_groundings_asset_id_talk_track_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."talk_track_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_source_groundings" ADD CONSTRAINT "talk_track_source_groundings_version_id_talk_track_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."talk_track_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_source_groundings" ADD CONSTRAINT "talk_track_source_groundings_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_usage_signals" ADD CONSTRAINT "talk_track_usage_signals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_usage_signals" ADD CONSTRAINT "talk_track_usage_signals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_usage_signals" ADD CONSTRAINT "talk_track_usage_signals_asset_id_talk_track_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."talk_track_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_usage_signals" ADD CONSTRAINT "talk_track_usage_signals_version_id_talk_track_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."talk_track_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_usage_signals" ADD CONSTRAINT "talk_track_usage_signals_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_versions" ADD CONSTRAINT "talk_track_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_versions" ADD CONSTRAINT "talk_track_versions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_versions" ADD CONSTRAINT "talk_track_versions_asset_id_talk_track_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."talk_track_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_versions" ADD CONSTRAINT "talk_track_versions_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_versions" ADD CONSTRAINT "talk_track_versions_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talk_track_versions" ADD CONSTRAINT "talk_track_versions_published_by_app_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "talk_track_assets_tenant_team_status_idx" ON "talk_track_assets" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "talk_track_assets_tenant_team_type_idx" ON "talk_track_assets" USING btree ("tenant_id","team_id","asset_type");--> statement-breakpoint
CREATE INDEX "talk_track_assets_scenario_fingerprint_idx" ON "talk_track_assets" USING btree ("tenant_id","team_id","asset_type","scenario_fingerprint");--> statement-breakpoint
CREATE INDEX "talk_track_candidates_tenant_team_review_idx" ON "talk_track_candidates" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE INDEX "talk_track_candidates_asset_idx" ON "talk_track_candidates" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "talk_track_candidates_ai_run_idx" ON "talk_track_candidates" USING btree ("ai_run_id");--> statement-breakpoint
CREATE INDEX "talk_track_objection_patterns_asset_idx" ON "talk_track_objection_patterns" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "talk_track_objection_patterns_type_idx" ON "talk_track_objection_patterns" USING btree ("tenant_id","team_id","objection_type");--> statement-breakpoint
CREATE INDEX "talk_track_review_decisions_asset_idx" ON "talk_track_review_decisions" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "talk_track_review_decisions_version_idx" ON "talk_track_review_decisions" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "talk_track_review_decisions_tenant_team_reviewed_at_idx" ON "talk_track_review_decisions" USING btree ("tenant_id","team_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "talk_track_scenarios_asset_idx" ON "talk_track_scenarios" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "talk_track_scenarios_fingerprint_idx" ON "talk_track_scenarios" USING btree ("tenant_id","team_id","scenario_fingerprint");--> statement-breakpoint
CREATE INDEX "talk_track_scenarios_scene_idx" ON "talk_track_scenarios" USING btree ("tenant_id","team_id","live_scene");--> statement-breakpoint
CREATE UNIQUE INDEX "talk_track_segments_version_position_unique" ON "talk_track_segments" USING btree ("version_id","position");--> statement-breakpoint
CREATE INDEX "talk_track_segments_version_idx" ON "talk_track_segments" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "talk_track_segments_tenant_team_type_idx" ON "talk_track_segments" USING btree ("tenant_id","team_id","segment_type");--> statement-breakpoint
CREATE INDEX "talk_track_source_groundings_asset_idx" ON "talk_track_source_groundings" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "talk_track_source_groundings_version_idx" ON "talk_track_source_groundings" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "talk_track_source_groundings_state_idx" ON "talk_track_source_groundings" USING btree ("tenant_id","team_id","freshness_state","conflict_state");--> statement-breakpoint
CREATE INDEX "talk_track_usage_signals_asset_idx" ON "talk_track_usage_signals" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "talk_track_usage_signals_version_idx" ON "talk_track_usage_signals" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "talk_track_usage_signals_tenant_team_signal_idx" ON "talk_track_usage_signals" USING btree ("tenant_id","team_id","signal_type");--> statement-breakpoint
CREATE UNIQUE INDEX "talk_track_versions_asset_version_unique" ON "talk_track_versions" USING btree ("asset_id","version");--> statement-breakpoint
CREATE INDEX "talk_track_versions_asset_idx" ON "talk_track_versions" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "talk_track_versions_tenant_team_status_idx" ON "talk_track_versions" USING btree ("tenant_id","team_id","status");