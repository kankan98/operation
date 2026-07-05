CREATE TABLE IF NOT EXISTS `product_business_signals` (
	`product_id` text PRIMARY KEY NOT NULL,
	`currency` text NOT NULL,
	`cost_basis` real,
	`inbound_shipping` real,
	`outbound_shipping` real,
	`fulfillment_fee` real,
	`platform_fee` real,
	`referral_fee_rate` real,
	`advertising_cost` real,
	`tax_customs_buffer` real,
	`target_sell_price` real,
	`target_units` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_product_business_signals_updated_at` ON `product_business_signals` (`updated_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `market_signal_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`platform` text NOT NULL,
	`provider` text NOT NULL,
	`source` text NOT NULL,
	`asin` text NOT NULL,
	`marketplace` text NOT NULL,
	`window_days` integer NOT NULL,
	`confidence` real NOT NULL,
	`freshness_ms` integer,
	`price_trend` text,
	`sales_rank_trend` text,
	`review_velocity` real,
	`rating_movement` real,
	`missing_signals` text DEFAULT '[]' NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_market_signal_snapshots_product_created` ON `market_signal_snapshots` (`product_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_market_signal_snapshots_provider_created` ON `market_signal_snapshots` (`provider`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `market_signal_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`provider` text NOT NULL,
	`source` text NOT NULL,
	`platform` text NOT NULL,
	`status` text NOT NULL,
	`failure_reason` text,
	`root_cause` text,
	`error_message` text,
	`duration_ms` integer NOT NULL,
	`confidence` real,
	`http_status` integer,
	`diagnostics` text,
	`snapshot_id` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`snapshot_id`) REFERENCES `market_signal_snapshots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_market_signal_attempts_product_timestamp` ON `market_signal_attempts` (`product_id`,`timestamp`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_market_signal_attempts_provider_timestamp` ON `market_signal_attempts` (`provider`,`timestamp`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_market_signal_attempts_status_timestamp` ON `market_signal_attempts` (`status`,`timestamp`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `opportunity_research_entries` (
	`product_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'researching' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_opportunity_research_status_archived` ON `opportunity_research_entries` (`status`,`archived`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_opportunity_research_priority_archived` ON `opportunity_research_entries` (`priority`,`archived`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_opportunity_research_updated_at` ON `opportunity_research_entries` (`updated_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `acquisition_queue_workers` (
	`worker_id` text PRIMARY KEY NOT NULL,
	`backend` text NOT NULL,
	`status` text NOT NULL,
	`concurrency` integer NOT NULL,
	`active_job_count` integer DEFAULT 0 NOT NULL,
	`queues_json` text DEFAULT '[]' NOT NULL,
	`started_at` integer NOT NULL,
	`last_heartbeat_at` integer NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_acquisition_queue_workers_heartbeat` ON `acquisition_queue_workers` (`last_heartbeat_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_acquisition_queue_workers_backend_status` ON `acquisition_queue_workers` (`backend`,`status`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `acquisition_provider_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`reset_at` integer,
	`current_concurrency` integer DEFAULT 0 NOT NULL,
	`max_concurrency` integer DEFAULT 1 NOT NULL,
	`active_count` integer DEFAULT 0 NOT NULL,
	`recent_root_causes_json` text DEFAULT '[]' NOT NULL,
	`recommendations_json` text DEFAULT '[]' NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_acquisition_provider_limits_unique_provider` ON `acquisition_provider_limits` (`platform`,`provider`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_acquisition_provider_limits_status` ON `acquisition_provider_limits` (`status`,`reset_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `acquisition_queue_events` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text,
	`product_id` text,
	`action` text NOT NULL,
	`status` text NOT NULL,
	`worker_id` text,
	`platform` text,
	`provider` text,
	`message` text,
	`metadata` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `scrape_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_acquisition_queue_events_job_timestamp` ON `acquisition_queue_events` (`job_id`,`timestamp`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_acquisition_queue_events_product_timestamp` ON `acquisition_queue_events` (`product_id`,`timestamp`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_products_platform` ON `products` (`platform`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_products_is_monitoring` ON `products` (`is_monitoring`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_products_platform_is_monitoring` ON `products` (`platform`,`is_monitoring`);
--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `decision_status` text;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `decision_reason` text;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `decision_next_action` text;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `decision_snapshot_json` text;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `decided_at` integer;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `decision_updated_at` integer;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `last_action_id` text;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `last_action_outcome` text;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `last_action_completed_at` integer;--> statement-breakpoint
ALTER TABLE `opportunity_research_entries` ADD `last_action_updated_at` integer;
