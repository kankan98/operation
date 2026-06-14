CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text,
	`product_id` text NOT NULL,
	`alert_type` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`data_snapshot` text,
	`is_read` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`notified_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `price_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`price` real NOT NULL,
	`currency` text NOT NULL,
	`availability` text NOT NULL,
	`rating` real,
	`review_count` integer,
	`sales_rank` integer,
	`shipping_cost` real,
	`seller` text,
	`condition` text,
	`timestamp` integer NOT NULL,
	`metadata` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`product_url` text NOT NULL,
	`asin` text,
	`title` text NOT NULL,
	`brand` text,
	`category` text,
	`image_url` text,
	`current_price` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`is_monitoring` integer DEFAULT false NOT NULL,
	`monitor_type` text,
	`check_interval` integer DEFAULT 24 NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`last_checked_at` integer,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_product_url_unique` ON `products` (`product_url`);