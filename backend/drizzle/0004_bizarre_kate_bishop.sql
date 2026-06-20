CREATE TABLE `scrape_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text,
	`product_id` text NOT NULL,
	`provider` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`failure_reason` text,
	`error_message` text,
	`duration_ms` integer NOT NULL,
	`confidence` real,
	`http_status` integer,
	`page_title` text,
	`final_url` text,
	`diagnostics` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `scrape_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scrape_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`status` text NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`next_run_at` integer NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`last_attempt_id` text,
	`last_failure_reason` text,
	`lease_owner` text,
	`lease_expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	`metadata` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `parts` text;