CREATE TYPE "public"."racket_alias_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."racket_alias_type" AS ENUM('official_en', 'official_cn', 'series_short', 'live_spoken', 'common_typo', 'team_note');--> statement-breakpoint
CREATE TYPE "public"."racket_balance_type" AS ENUM('head_light', 'even', 'head_heavy', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."racket_product_status" AS ENUM('draft', 'needs_source', 'reviewing', 'approved', 'published', 'stale', 'conflict', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."racket_review_state" AS ENUM('pending', 'approved', 'rejected', 'conflict');--> statement-breakpoint
CREATE TABLE "racket_product_aliases" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"product_id" text NOT NULL,
	"alias" varchar(180) NOT NULL,
	"normalized_alias" varchar(180) NOT NULL,
	"alias_type" "racket_alias_type" NOT NULL,
	"confidence" "racket_alias_confidence" DEFAULT 'medium' NOT NULL,
	"review_state" "racket_review_state" DEFAULT 'pending' NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "racket_products" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"team_id" text NOT NULL,
	"brand" varchar(120) NOT NULL,
	"series" varchar(120) DEFAULT '' NOT NULL,
	"model" varchar(180) NOT NULL,
	"normalized_model" varchar(180) NOT NULL,
	"status" "racket_product_status" DEFAULT 'needs_source' NOT NULL,
	"weight_classes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"balance_point" varchar(120) DEFAULT '' NOT NULL,
	"balance_type" "racket_balance_type" DEFAULT 'unknown' NOT NULL,
	"shaft_stiffness" varchar(120) DEFAULT '' NOT NULL,
	"recommended_tension" varchar(120) DEFAULT '' NOT NULL,
	"player_levels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"play_styles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_band" varchar(120) DEFAULT '' NOT NULL,
	"selling_focus" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"limitations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "racket_product_aliases" ADD CONSTRAINT "racket_product_aliases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_aliases" ADD CONSTRAINT "racket_product_aliases_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_aliases" ADD CONSTRAINT "racket_product_aliases_product_id_racket_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."racket_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_aliases" ADD CONSTRAINT "racket_product_aliases_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_product_aliases" ADD CONSTRAINT "racket_product_aliases_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_products" ADD CONSTRAINT "racket_products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_products" ADD CONSTRAINT "racket_products_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_products" ADD CONSTRAINT "racket_products_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_products" ADD CONSTRAINT "racket_products_updated_by_app_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "racket_aliases_scope_alias_unique" ON "racket_product_aliases" USING btree ("tenant_id","team_id","normalized_alias");--> statement-breakpoint
CREATE INDEX "racket_aliases_product_id_idx" ON "racket_product_aliases" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "racket_aliases_tenant_team_review_idx" ON "racket_product_aliases" USING btree ("tenant_id","team_id","review_state");--> statement-breakpoint
CREATE UNIQUE INDEX "racket_products_scope_model_unique" ON "racket_products" USING btree ("tenant_id","team_id","normalized_model");--> statement-breakpoint
CREATE INDEX "racket_products_tenant_team_status_idx" ON "racket_products" USING btree ("tenant_id","team_id","status");--> statement-breakpoint
CREATE INDEX "racket_products_tenant_team_created_at_idx" ON "racket_products" USING btree ("tenant_id","team_id","created_at");