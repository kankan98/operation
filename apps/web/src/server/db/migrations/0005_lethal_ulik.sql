CREATE TYPE "public"."next_session_task_assignee_role" AS ENUM('owner', 'collaborator', 'reviewer', 'watcher');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_assignment_state" AS ENUM('active', 'inactive', 'transferred', 'removed');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_checklist_status" AS ENUM('todo', 'done', 'blocked', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_deadline_policy" AS ENUM('absolute', 'before_next_session', 'no_due_date');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_dependency_state" AS ENUM('pending', 'satisfied', 'blocked', 'waived');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_dependency_type" AS ENUM('task', 'session', 'product', 'knowledge_version', 'talk_track', 'review_decision');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_feedback_route" AS ENUM('team_review', 'knowledge_review', 'prompt_review', 'workflow_review', 'none');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_feedback_signal" AS ENUM('completed', 'reopened', 'blocked', 'duplicate', 'not_useful', 'helped_next_session', 'missed_due_date', 'needs_better_source');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_redaction_state" AS ENUM('not_needed', 'redacted', 'needs_review', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_review_decision" AS ENUM('approve_close', 'request_changes', 'reject_result', 'reopen', 'cancel');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_source_state" AS ENUM('draft', 'candidate', 'review_ready', 'accepted', 'partially_accepted', 'manual', 'rejected', 'provider_failed', 'validation_failed');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_source_workflow" AS ENUM('session_capture', 'ai_review', 'knowledge_gap', 'talk_track', 'qa_feedback', 'manual');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_status" AS ENUM('draft', 'assigned', 'in_progress', 'blocked', 'done', 'reviewing', 'closed', 'reopened', 'canceled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."next_session_task_type" AS ENUM('prepare_product_info', 'fix_talk_track', 'review_knowledge_gap', 'follow_up_question', 'plan_short_video', 'update_session_theme', 'assign_review', 'export_or_report', 'other');--> statement-breakpoint
CREATE TABLE "next_session_task_assignees" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "next_session_task_assignee_role" NOT NULL,
	"assignment_state" "next_session_task_assignment_state" DEFAULT 'active' NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_session_task_checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"task_id" text NOT NULL,
	"title" varchar(240) NOT NULL,
	"status" "next_session_task_checklist_status" DEFAULT 'todo' NOT NULL,
	"position" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"completed_by" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_session_task_dependencies" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"task_id" text NOT NULL,
	"depends_on_type" "next_session_task_dependency_type" NOT NULL,
	"depends_on_id" varchar(180) NOT NULL,
	"dependency_state" "next_session_task_dependency_state" DEFAULT 'pending' NOT NULL,
	"reason" varchar(600) NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_session_task_feedback_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"task_id" text NOT NULL,
	"source_workflow" "next_session_task_source_workflow" NOT NULL,
	"signal_type" "next_session_task_feedback_signal" NOT NULL,
	"reason" varchar(600) NOT NULL,
	"routes_to" "next_session_task_feedback_route" DEFAULT 'none' NOT NULL,
	"actor_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_session_task_review_results" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"task_id" text NOT NULL,
	"decision" "next_session_task_review_decision" NOT NULL,
	"reason" varchar(600) NOT NULL,
	"result_summary" text DEFAULT '' NOT NULL,
	"reviewed_by" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_session_task_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"task_id" text NOT NULL,
	"source_workflow" "next_session_task_source_workflow" NOT NULL,
	"source_id" varchar(180) NOT NULL,
	"source_version_id" varchar(180) DEFAULT '' NOT NULL,
	"source_section_id" varchar(180) DEFAULT '' NOT NULL,
	"ai_run_id" varchar(180) DEFAULT '' NOT NULL,
	"prompt_version" varchar(180) DEFAULT '' NOT NULL,
	"source_state" "next_session_task_source_state" NOT NULL,
	"knowledge_version_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"racket_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"talk_track_asset_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sensitive_redaction_state" "next_session_task_redaction_state" DEFAULT 'not_needed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "next_session_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"title" varchar(240) NOT NULL,
	"summary" text NOT NULL,
	"task_type" "next_session_task_type" NOT NULL,
	"priority" "next_session_task_priority" DEFAULT 'normal' NOT NULL,
	"status" "next_session_task_status" DEFAULT 'draft' NOT NULL,
	"owner_id" text,
	"target_session_id" text,
	"source_workflow" "next_session_task_source_workflow" NOT NULL,
	"deadline_policy" "next_session_task_deadline_policy" DEFAULT 'no_due_date' NOT NULL,
	"due_at" timestamp with time zone,
	"review_required" boolean DEFAULT false NOT NULL,
	"blocked_reason" varchar(800) DEFAULT '' NOT NULL,
	"result_summary" text DEFAULT '' NOT NULL,
	"duplicate_fingerprint" varchar(360) NOT NULL,
	"related_racket_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"completed_by" text,
	"completed_at" timestamp with time zone,
	"closed_by" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "next_session_task_assignees" ADD CONSTRAINT "next_session_task_assignees_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_assignees" ADD CONSTRAINT "next_session_task_assignees_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_assignees" ADD CONSTRAINT "next_session_task_assignees_task_id_next_session_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."next_session_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_assignees" ADD CONSTRAINT "next_session_task_assignees_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_assignees" ADD CONSTRAINT "next_session_task_assignees_assigned_by_app_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_checklist_items" ADD CONSTRAINT "next_session_task_checklist_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_checklist_items" ADD CONSTRAINT "next_session_task_checklist_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_checklist_items" ADD CONSTRAINT "next_session_task_checklist_items_task_id_next_session_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."next_session_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_checklist_items" ADD CONSTRAINT "next_session_task_checklist_items_completed_by_app_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_dependencies" ADD CONSTRAINT "next_session_task_dependencies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_dependencies" ADD CONSTRAINT "next_session_task_dependencies_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_dependencies" ADD CONSTRAINT "next_session_task_dependencies_task_id_next_session_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."next_session_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_dependencies" ADD CONSTRAINT "next_session_task_dependencies_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_dependencies" ADD CONSTRAINT "next_session_task_dependencies_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_feedback_signals" ADD CONSTRAINT "next_session_task_feedback_signals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_feedback_signals" ADD CONSTRAINT "next_session_task_feedback_signals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_feedback_signals" ADD CONSTRAINT "next_session_task_feedback_signals_task_id_next_session_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."next_session_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_feedback_signals" ADD CONSTRAINT "next_session_task_feedback_signals_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_review_results" ADD CONSTRAINT "next_session_task_review_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_review_results" ADD CONSTRAINT "next_session_task_review_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_review_results" ADD CONSTRAINT "next_session_task_review_results_task_id_next_session_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."next_session_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_review_results" ADD CONSTRAINT "next_session_task_review_results_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_sources" ADD CONSTRAINT "next_session_task_sources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_sources" ADD CONSTRAINT "next_session_task_sources_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_task_sources" ADD CONSTRAINT "next_session_task_sources_task_id_next_session_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."next_session_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_tasks" ADD CONSTRAINT "next_session_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_tasks" ADD CONSTRAINT "next_session_tasks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_tasks" ADD CONSTRAINT "next_session_tasks_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_tasks" ADD CONSTRAINT "next_session_tasks_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_tasks" ADD CONSTRAINT "next_session_tasks_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_tasks" ADD CONSTRAINT "next_session_tasks_completed_by_app_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "next_session_tasks" ADD CONSTRAINT "next_session_tasks_closed_by_app_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "next_task_assignees_task_idx" ON "next_session_task_assignees" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "next_task_assignees_user_idx" ON "next_session_task_assignees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "next_task_assignees_tenant_team_role_idx" ON "next_session_task_assignees" USING btree ("tenant_id","team_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "next_task_checklist_task_position_unique" ON "next_session_task_checklist_items" USING btree ("task_id","position");--> statement-breakpoint
CREATE INDEX "next_task_checklist_task_idx" ON "next_session_task_checklist_items" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "next_task_checklist_tenant_team_status_idx" ON "next_session_task_checklist_items" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "next_task_dependencies_task_idx" ON "next_session_task_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "next_task_dependencies_tenant_team_state_idx" ON "next_session_task_dependencies" USING btree ("tenant_id","team_id","dependency_state");--> statement-breakpoint
CREATE INDEX "next_task_dependencies_depends_on_idx" ON "next_session_task_dependencies" USING btree ("depends_on_type","depends_on_id");--> statement-breakpoint
CREATE INDEX "next_task_feedback_task_idx" ON "next_session_task_feedback_signals" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "next_task_feedback_tenant_team_signal_idx" ON "next_session_task_feedback_signals" USING btree ("tenant_id","team_id","signal_type");--> statement-breakpoint
CREATE INDEX "next_task_feedback_tenant_team_route_idx" ON "next_session_task_feedback_signals" USING btree ("tenant_id","team_id","routes_to");--> statement-breakpoint
CREATE INDEX "next_task_review_results_task_idx" ON "next_session_task_review_results" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "next_task_review_results_tenant_team_reviewed_idx" ON "next_session_task_review_results" USING btree ("tenant_id","team_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "next_task_sources_task_idx" ON "next_session_task_sources" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "next_task_sources_tenant_team_source_idx" ON "next_session_task_sources" USING btree ("tenant_id","team_id","source_workflow","source_id");--> statement-breakpoint
CREATE INDEX "next_task_sources_redaction_idx" ON "next_session_task_sources" USING btree ("tenant_id","team_id","sensitive_redaction_state");--> statement-breakpoint
CREATE INDEX "next_tasks_tenant_team_status_idx" ON "next_session_tasks" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "next_tasks_tenant_team_owner_idx" ON "next_session_tasks" USING btree ("tenant_id","team_id","owner_id");--> statement-breakpoint
CREATE INDEX "next_tasks_tenant_team_due_idx" ON "next_session_tasks" USING btree ("tenant_id","team_id","due_at");--> statement-breakpoint
CREATE INDEX "next_tasks_tenant_team_source_idx" ON "next_session_tasks" USING btree ("tenant_id","team_id","source_workflow");--> statement-breakpoint
CREATE INDEX "next_tasks_duplicate_fingerprint_idx" ON "next_session_tasks" USING btree ("tenant_id","team_id","duplicate_fingerprint");