CREATE TYPE "public"."racket_review_decision" AS ENUM('approve', 'reject', 'request_source', 'mark_conflict', 'archive');--> statement-breakpoint
CREATE TYPE "public"."racket_review_target_type" AS ENUM('product', 'alias', 'source', 'selling_point', 'comparison');--> statement-breakpoint
CREATE TYPE "public"."racket_source_refresh_policy" AS ENUM('manual', 'monthly', 'quarterly', 'on_demand');--> statement-breakpoint
CREATE TYPE "public"."racket_source_review_state" AS ENUM('pending', 'approved', 'rejected', 'stale');--> statement-breakpoint
CREATE TYPE "public"."racket_source_trust_level" AS ENUM('official', 'commerce', 'team', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."racket_source_type" AS ENUM('official_site', 'brand_catalog', 'commerce_page', 'team_note', 'manual_review');--> statement-breakpoint
CREATE TABLE "racket_product_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"product_id" text NOT NULL,
	"source_type" "racket_source_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"url" varchar(2048) DEFAULT '' NOT NULL,
	"normalized_source_key" varchar(320) NOT NULL,
	"retrieved_at" timestamp with time zone NOT NULL,
	"trust_level" "racket_source_trust_level" DEFAULT 'unknown' NOT NULL,
	"refresh_policy" "racket_source_refresh_policy" DEFAULT 'manual' NOT NULL,
	"review_state" "racket_source_review_state" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "racket_review_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"product_id" text NOT NULL,
	"target_type" "racket_review_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"decision" "racket_review_decision" NOT NULL,
	"reason" varchar(500) NOT NULL,
	"reviewed_by" text NOT NULL,
	"request_id" varchar(120) NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "racket_products" ADD COLUMN "published_version_id" text;--> statement-breakpoint
ALTER TABLE "racket_products" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "racket_products" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "racket_products" ADD COLUMN "published_by" text;--> statement-breakpoint
ALTER TABLE "racket_products" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "racket_products" ADD COLUMN "change_reason" varchar(500) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "racket_product_sources" ADD CONSTRAINT "racket_product_sources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_sources" ADD CONSTRAINT "racket_product_sources_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_sources" ADD CONSTRAINT "racket_product_sources_product_id_racket_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."racket_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_sources" ADD CONSTRAINT "racket_product_sources_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_sources" ADD CONSTRAINT "racket_product_sources_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_sources" ADD CONSTRAINT "racket_product_sources_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_review_decisions" ADD CONSTRAINT "racket_review_decisions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_review_decisions" ADD CONSTRAINT "racket_review_decisions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_review_decisions" ADD CONSTRAINT "racket_review_decisions_product_id_racket_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."racket_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_review_decisions" ADD CONSTRAINT "racket_review_decisions_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "racket_sources_scope_product_key_unique" ON "racket_product_sources" USING btree ("tenant_id","team_id","product_id","normalized_source_key");--> statement-breakpoint
CREATE INDEX "racket_sources_product_id_idx" ON "racket_product_sources" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "racket_sources_tenant_team_review_idx" ON "racket_product_sources" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE INDEX "racket_sources_tenant_team_trust_idx" ON "racket_product_sources" USING btree ("tenant_id","team_id","trust_level");--> statement-breakpoint
CREATE INDEX "racket_review_decisions_product_idx" ON "racket_review_decisions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "racket_review_decisions_target_idx" ON "racket_review_decisions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "racket_review_decisions_tenant_team_reviewed_at_idx" ON "racket_review_decisions" USING btree ("tenant_id","team_id","reviewed_at");--> statement-breakpoint
ALTER TABLE "racket_products" ADD CONSTRAINT "racket_products_reviewed_by_app_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_products" ADD CONSTRAINT "racket_products_published_by_app_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;