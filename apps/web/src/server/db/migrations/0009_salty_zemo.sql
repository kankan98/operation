CREATE TYPE "public"."v0_trial_feedback_evaluator_role" AS ENUM('live_operator', 'host_assistant', 'product_owner', 'team_lead', 'reviewer', 'other');--> statement-breakpoint
CREATE TYPE "public"."v0_trial_feedback_issue_type" AS ENUM('copy_confusion', 'missing_data', 'ai_quality', 'workflow_break', 'mobile_layout', 'source_trust', 'downstream_action', 'performance', 'other');--> statement-breakpoint
CREATE TYPE "public"."v0_trial_feedback_real_work_signal" AS ENUM('yes', 'maybe', 'no', 'not_sure');--> statement-breakpoint
CREATE TYPE "public"."v0_trial_feedback_workbench" AS ENUM('overview', 'trial', 'sessions', 'rackets', 'knowledge', 'ai_review', 'talk_tracks', 'next_actions');--> statement-breakpoint
CREATE TABLE "v0_trial_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"evaluator_role" "v0_trial_feedback_evaluator_role" NOT NULL,
	"workbench" "v0_trial_feedback_workbench" NOT NULL,
	"page_path" varchar(160) DEFAULT '' NOT NULL,
	"usefulness_rating" integer NOT NULL,
	"clarity_rating" integer NOT NULL,
	"issue_type" "v0_trial_feedback_issue_type" NOT NULL,
	"note" text NOT NULL,
	"real_work_signal" "v0_trial_feedback_real_work_signal",
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "v0_trial_feedback" ADD CONSTRAINT "v0_trial_feedback_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_feedback" ADD CONSTRAINT "v0_trial_feedback_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "v0_trial_feedback" ADD CONSTRAINT "v0_trial_feedback_actor_id_app_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "v0_trial_feedback_tenant_team_created_idx" ON "v0_trial_feedback" USING btree ("tenant_id","team_id","created_at");--> statement-breakpoint
CREATE INDEX "v0_trial_feedback_tenant_team_workbench_idx" ON "v0_trial_feedback" USING btree ("tenant_id","team_id","workbench");--> statement-breakpoint
CREATE INDEX "v0_trial_feedback_tenant_team_issue_idx" ON "v0_trial_feedback" USING btree ("tenant_id","team_id","issue_type");--> statement-breakpoint
CREATE INDEX "v0_trial_feedback_actor_idx" ON "v0_trial_feedback" USING btree ("actor_id");