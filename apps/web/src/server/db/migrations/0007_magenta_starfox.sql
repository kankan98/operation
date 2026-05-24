CREATE TYPE "public"."ai_review_confidence" AS ENUM('high', 'medium', 'low', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."ai_review_decision" AS ENUM('accept', 'edit_accept', 'reject', 'request_regeneration', 'mark_needs_source');--> statement-breakpoint
CREATE TYPE "public"."ai_review_decision_target_type" AS ENUM('run', 'section', 'item');--> statement-breakpoint
CREATE TYPE "public"."ai_review_downstream_artifact_status" AS ENUM('draft', 'reviewing', 'accepted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ai_review_downstream_artifact_type" AS ENUM('talk_track', 'short_video_topic', 'next_session_task', 'knowledge_gap');--> statement-breakpoint
CREATE TYPE "public"."ai_review_feedback_route" AS ENUM('evaluation_set', 'knowledge_review', 'prompt_review', 'none');--> statement-breakpoint
CREATE TYPE "public"."ai_review_feedback_signal" AS ENUM('accepted', 'edited', 'rejected', 'regenerated', 'missing_knowledge', 'wrong_source', 'evidence_weak', 'downstream_used');--> statement-breakpoint
CREATE TYPE "public"."ai_review_knowledge_conflict_state" AS ENUM('none', 'low_risk', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."ai_review_knowledge_freshness_state" AS ENUM('current', 'stale_warning', 'stale_blocked');--> statement-breakpoint
CREATE TYPE "public"."ai_review_knowledge_review_state" AS ENUM('published_only', 'approved_candidates', 'insufficient', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."ai_review_long_input_policy" AS ENUM('within_limit', 'chunked', 'truncated_with_notice', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."ai_review_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ai_review_prompt_purpose" AS ENUM('full_review', 'section_regeneration', 'validation');--> statement-breakpoint
CREATE TYPE "public"."ai_review_prompt_status" AS ENUM('draft', 'reviewed', 'active', 'deprecated');--> statement-breakpoint
CREATE TYPE "public"."ai_review_redaction_state" AS ENUM('not_needed', 'redacted', 'needs_review', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."ai_review_requested_section" AS ENUM('live_recap', 'product_diagnosis', 'question_cluster', 'objection_pattern', 'talk_track_candidate', 'short_video_topic', 'next_session_action');--> statement-breakpoint
CREATE TYPE "public"."ai_review_run_status" AS ENUM('draft', 'input_ready', 'blocked', 'queued', 'generating', 'provider_failed', 'validating', 'validation_failed', 'review_ready', 'reviewing', 'accepted', 'partially_accepted', 'rejected', 'regeneration_requested', 'regenerated', 'downstream_ready', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ai_review_run_type" AS ENUM('initial_review', 'regeneration', 'section_regeneration', 'manual_import');--> statement-breakpoint
CREATE TYPE "public"."ai_review_section_review_state" AS ENUM('pending', 'accepted', 'edited', 'rejected', 'regenerate_requested');--> statement-breakpoint
CREATE TYPE "public"."ai_review_section_type" AS ENUM('live_recap', 'product_diagnosis', 'question_cluster', 'objection_pattern', 'talk_track_candidate', 'short_video_topic', 'next_session_action');--> statement-breakpoint
CREATE TYPE "public"."ai_review_validation_check_type" AS ENUM('schema', 'empty_section', 'source_grounding', 'stale_source', 'sensitive_data', 'fact_conflict', 'long_input', 'policy');--> statement-breakpoint
CREATE TYPE "public"."ai_review_validation_status" AS ENUM('passed', 'warning', 'failed', 'blocked');--> statement-breakpoint
CREATE TABLE "ai_provider_invocations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"run_id" text NOT NULL,
	"provider" varchar(80) NOT NULL,
	"provider_api" varchar(120) NOT NULL,
	"model" varchar(160) NOT NULL,
	"request_id" varchar(180) NOT NULL,
	"response_id" varchar(180) DEFAULT '' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"token_usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"finish_reason" varchar(160) DEFAULT '' NOT NULL,
	"error_code" varchar(120) DEFAULT '' NOT NULL,
	"redaction_state" "ai_review_redaction_state" DEFAULT 'not_needed' NOT NULL,
	"recoverable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"run_id" text NOT NULL,
	"target_type" "ai_review_decision_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"decision" "ai_review_decision" NOT NULL,
	"reason" varchar(800) NOT NULL,
	"edited_content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reviewed_by" text NOT NULL,
	"request_id" varchar(120) NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_downstream_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"run_id" text NOT NULL,
	"section_id" text NOT NULL,
	"artifact_type" "ai_review_downstream_artifact_type" NOT NULL,
	"status" "ai_review_downstream_artifact_status" DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_feedback_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"run_id" text NOT NULL,
	"section_id" text,
	"signal_type" "ai_review_feedback_signal" NOT NULL,
	"reason" varchar(800) NOT NULL,
	"review_priority" "ai_review_priority" DEFAULT 'normal' NOT NULL,
	"routes_to" "ai_review_feedback_route" DEFAULT 'none' NOT NULL,
	"actor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_input_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text NOT NULL,
	"session_status" "session_capture_status" NOT NULL,
	"title" varchar(240) NOT NULL,
	"session_date" timestamp with time zone NOT NULL,
	"platform" "session_platform" NOT NULL,
	"host_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"product_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"operator_summary" text NOT NULL,
	"question_summaries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objection_summaries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note_highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"redaction_state" "ai_review_redaction_state" DEFAULT 'not_needed' NOT NULL,
	"long_input_policy" "ai_review_long_input_policy" DEFAULT 'within_limit' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_knowledge_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"knowledge_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"racket_product_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"trust_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"conflict_state" "ai_review_knowledge_conflict_state" DEFAULT 'none' NOT NULL,
	"freshness_state" "ai_review_knowledge_freshness_state" DEFAULT 'current' NOT NULL,
	"review_state" "ai_review_knowledge_review_state" DEFAULT 'published_only' NOT NULL,
	"intended_use" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_outputs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"run_id" text NOT NULL,
	"schema_version" varchar(120) NOT NULL,
	"overall_confidence" "ai_review_confidence" DEFAULT 'unknown' NOT NULL,
	"evidence_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_prompt_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"name" varchar(180) NOT NULL,
	"version" varchar(80) NOT NULL,
	"purpose" "ai_review_prompt_purpose" NOT NULL,
	"input_schema_version" varchar(120) NOT NULL,
	"output_schema_version" varchar(120) NOT NULL,
	"model_policy" text NOT NULL,
	"status" "ai_review_prompt_status" DEFAULT 'draft' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"session_id" text NOT NULL,
	"status" "ai_review_run_status" DEFAULT 'draft' NOT NULL,
	"run_type" "ai_review_run_type" NOT NULL,
	"parent_run_id" text DEFAULT '' NOT NULL,
	"input_snapshot_id" text NOT NULL,
	"knowledge_snapshot_id" text NOT NULL,
	"prompt_version_id" text,
	"provider_invocation_id" text,
	"requested_sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"archived_by" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"output_id" text NOT NULL,
	"run_id" text NOT NULL,
	"section_type" "ai_review_section_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"summary" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence" "ai_review_confidence" DEFAULT 'unknown' NOT NULL,
	"review_state" "ai_review_section_review_state" DEFAULT 'pending' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_validation_results" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"run_id" text NOT NULL,
	"check_type" "ai_review_validation_check_type" NOT NULL,
	"status" "ai_review_validation_status" NOT NULL,
	"message" varchar(800) NOT NULL,
	"affected_section_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recoverable" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_provider_invocations" ADD CONSTRAINT "ai_provider_invocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_invocations" ADD CONSTRAINT "ai_provider_invocations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_invocations" ADD CONSTRAINT "ai_provider_invocations_run_id_ai_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_decisions" ADD CONSTRAINT "ai_review_decisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_decisions" ADD CONSTRAINT "ai_review_decisions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_decisions" ADD CONSTRAINT "ai_review_decisions_run_id_ai_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_decisions" ADD CONSTRAINT "ai_review_decisions_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_downstream_artifacts" ADD CONSTRAINT "ai_review_downstream_artifacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_downstream_artifacts" ADD CONSTRAINT "ai_review_downstream_artifacts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_downstream_artifacts" ADD CONSTRAINT "ai_review_downstream_artifacts_run_id_ai_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_downstream_artifacts" ADD CONSTRAINT "ai_review_downstream_artifacts_section_id_ai_review_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."ai_review_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_downstream_artifacts" ADD CONSTRAINT "ai_review_downstream_artifacts_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_feedback_signals" ADD CONSTRAINT "ai_review_feedback_signals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_feedback_signals" ADD CONSTRAINT "ai_review_feedback_signals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_feedback_signals" ADD CONSTRAINT "ai_review_feedback_signals_run_id_ai_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_feedback_signals" ADD CONSTRAINT "ai_review_feedback_signals_section_id_ai_review_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."ai_review_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_feedback_signals" ADD CONSTRAINT "ai_review_feedback_signals_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_input_snapshots" ADD CONSTRAINT "ai_review_input_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_input_snapshots" ADD CONSTRAINT "ai_review_input_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_input_snapshots" ADD CONSTRAINT "ai_review_input_snapshots_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_knowledge_snapshots" ADD CONSTRAINT "ai_review_knowledge_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_knowledge_snapshots" ADD CONSTRAINT "ai_review_knowledge_snapshots_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_knowledge_snapshots" ADD CONSTRAINT "ai_review_knowledge_snapshots_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_outputs" ADD CONSTRAINT "ai_review_outputs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_outputs" ADD CONSTRAINT "ai_review_outputs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_outputs" ADD CONSTRAINT "ai_review_outputs_run_id_ai_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_outputs" ADD CONSTRAINT "ai_review_outputs_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_prompt_versions" ADD CONSTRAINT "ai_review_prompt_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_prompt_versions" ADD CONSTRAINT "ai_review_prompt_versions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_prompt_versions" ADD CONSTRAINT "ai_review_prompt_versions_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_prompt_versions" ADD CONSTRAINT "ai_review_prompt_versions_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_prompt_versions" ADD CONSTRAINT "ai_review_prompt_versions_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_input_snapshot_id_ai_review_input_snapshots_id_fk" FOREIGN KEY ("input_snapshot_id") REFERENCES "public"."ai_review_input_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_knowledge_snapshot_id_ai_review_knowledge_snapshots_id_fk" FOREIGN KEY ("knowledge_snapshot_id") REFERENCES "public"."ai_review_knowledge_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_prompt_version_id_ai_review_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."ai_review_prompt_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_runs" ADD CONSTRAINT "ai_review_runs_archived_by_app_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_sections" ADD CONSTRAINT "ai_review_sections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_sections" ADD CONSTRAINT "ai_review_sections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_sections" ADD CONSTRAINT "ai_review_sections_output_id_ai_review_outputs_id_fk" FOREIGN KEY ("output_id") REFERENCES "public"."ai_review_outputs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_sections" ADD CONSTRAINT "ai_review_sections_run_id_ai_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_validation_results" ADD CONSTRAINT "ai_review_validation_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_validation_results" ADD CONSTRAINT "ai_review_validation_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_validation_results" ADD CONSTRAINT "ai_review_validation_results_run_id_ai_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_review_validation_results" ADD CONSTRAINT "ai_review_validation_results_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_provider_invocations_run_idx" ON "ai_provider_invocations" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_provider_invocations_provider_idx" ON "ai_provider_invocations" USING btree ("tenant_id","team_id","provider","model");--> statement-breakpoint
CREATE INDEX "ai_provider_invocations_error_idx" ON "ai_provider_invocations" USING btree ("tenant_id","team_id","error_code");--> statement-breakpoint
CREATE INDEX "ai_review_decisions_run_idx" ON "ai_review_decisions" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_review_decisions_target_idx" ON "ai_review_decisions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "ai_review_decisions_tenant_team_reviewed_idx" ON "ai_review_decisions" USING btree ("tenant_id","team_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "ai_review_downstream_artifacts_run_idx" ON "ai_review_downstream_artifacts" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_review_downstream_artifacts_section_idx" ON "ai_review_downstream_artifacts" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "ai_review_downstream_artifacts_tenant_team_type_idx" ON "ai_review_downstream_artifacts" USING btree ("tenant_id","team_id","artifact_type","status");--> statement-breakpoint
CREATE INDEX "ai_review_feedback_signals_run_idx" ON "ai_review_feedback_signals" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_review_feedback_signals_section_idx" ON "ai_review_feedback_signals" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "ai_review_feedback_signals_tenant_team_route_idx" ON "ai_review_feedback_signals" USING btree ("tenant_id","team_id","routes_to","review_priority");--> statement-breakpoint
CREATE INDEX "ai_review_input_snapshots_session_idx" ON "ai_review_input_snapshots" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_review_input_snapshots_tenant_team_state_idx" ON "ai_review_input_snapshots" USING btree ("tenant_id","team_id","redaction_state","long_input_policy");--> statement-breakpoint
CREATE INDEX "ai_review_input_snapshots_tenant_team_created_idx" ON "ai_review_input_snapshots" USING btree ("tenant_id","team_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_review_knowledge_snapshots_state_idx" ON "ai_review_knowledge_snapshots" USING btree ("tenant_id","team_id","conflict_state","freshness_state","review_state");--> statement-breakpoint
CREATE INDEX "ai_review_knowledge_snapshots_created_idx" ON "ai_review_knowledge_snapshots" USING btree ("tenant_id","team_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_review_outputs_run_idx" ON "ai_review_outputs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_review_outputs_tenant_team_created_idx" ON "ai_review_outputs" USING btree ("tenant_id","team_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_review_prompt_versions_scope_unique" ON "ai_review_prompt_versions" USING btree ("tenant_id","team_id","name","version","purpose");--> statement-breakpoint
CREATE INDEX "ai_review_prompt_versions_status_idx" ON "ai_review_prompt_versions" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "ai_review_runs_tenant_team_status_idx" ON "ai_review_runs" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "ai_review_runs_tenant_team_session_idx" ON "ai_review_runs" USING btree ("tenant_id","team_id","session_id");--> statement-breakpoint
CREATE INDEX "ai_review_runs_tenant_team_created_idx" ON "ai_review_runs" USING btree ("tenant_id","team_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_review_sections_output_position_unique" ON "ai_review_sections" USING btree ("output_id","position");--> statement-breakpoint
CREATE INDEX "ai_review_sections_run_idx" ON "ai_review_sections" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_review_sections_tenant_team_review_idx" ON "ai_review_sections" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE INDEX "ai_review_sections_tenant_team_type_idx" ON "ai_review_sections" USING btree ("tenant_id","team_id","section_type");--> statement-breakpoint
CREATE INDEX "ai_review_validation_results_run_idx" ON "ai_review_validation_results" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "ai_review_validation_results_tenant_team_status_idx" ON "ai_review_validation_results" USING btree ("tenant_id","team_id","status");