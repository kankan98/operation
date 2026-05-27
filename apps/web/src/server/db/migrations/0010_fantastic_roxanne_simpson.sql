CREATE TYPE "public"."v0_trial_run_status" AS ENUM('active', 'completed', 'abandoned', 'archived');--> statement-breakpoint
CREATE TYPE "public"."v0_trial_run_step_id" AS ENUM('sessions', 'rackets', 'knowledge', 'ai_review', 'talk_tracks', 'next_actions');--> statement-breakpoint
CREATE TYPE "public"."v0_trial_run_step_status" AS ENUM('pending', 'passed', 'issue', 'skipped');--> statement-breakpoint
CREATE TABLE "v0_trial_run_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"step_id" "v0_trial_run_step_id" NOT NULL,
	"status" "v0_trial_run_step_status" DEFAULT 'pending' NOT NULL,
	"friction_type" "v0_trial_feedback_issue_type",
	"note" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "v0_trial_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"evaluator_role" "v0_trial_feedback_evaluator_role" NOT NULL,
	"status" "v0_trial_run_status" DEFAULT 'active' NOT NULL,
	"summary_note" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "v0_trial_feedback" ADD COLUMN "trial_run_id" text;--> statement-breakpoint
ALTER TABLE "v0_trial_feedback" ADD COLUMN "trial_run_step_id" text;--> statement-breakpoint
ALTER TABLE "v0_trial_run_steps" ADD CONSTRAINT "v0_trial_run_steps_run_id_v0_trial_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."v0_trial_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_run_steps" ADD CONSTRAINT "v0_trial_run_steps_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_run_steps" ADD CONSTRAINT "v0_trial_run_steps_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_run_steps" ADD CONSTRAINT "v0_trial_run_steps_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_runs" ADD CONSTRAINT "v0_trial_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_runs" ADD CONSTRAINT "v0_trial_runs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_runs" ADD CONSTRAINT "v0_trial_runs_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "v0_trial_run_steps_run_step_unique" ON "v0_trial_run_steps" USING btree ("run_id","step_id");--> statement-breakpoint
CREATE INDEX "v0_trial_run_steps_run_idx" ON "v0_trial_run_steps" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "v0_trial_run_steps_tenant_team_status_idx" ON "v0_trial_run_steps" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "v0_trial_run_steps_actor_idx" ON "v0_trial_run_steps" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "v0_trial_runs_tenant_team_status_idx" ON "v0_trial_runs" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "v0_trial_runs_tenant_team_created_idx" ON "v0_trial_runs" USING btree ("tenant_id","team_id","created_at");--> statement-breakpoint
CREATE INDEX "v0_trial_runs_actor_idx" ON "v0_trial_runs" USING btree ("actor_id");--> statement-breakpoint
ALTER TABLE "v0_trial_feedback" ADD CONSTRAINT "v0_trial_feedback_trial_run_id_v0_trial_runs_id_fk" FOREIGN KEY ("trial_run_id") REFERENCES "public"."v0_trial_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_feedback" ADD CONSTRAINT "v0_trial_feedback_trial_run_step_id_v0_trial_run_steps_id_fk" FOREIGN KEY ("trial_run_step_id") REFERENCES "public"."v0_trial_run_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "v0_trial_feedback_trial_run_idx" ON "v0_trial_feedback" USING btree ("trial_run_id");--> statement-breakpoint
CREATE INDEX "v0_trial_feedback_trial_run_step_idx" ON "v0_trial_feedback" USING btree ("trial_run_step_id");