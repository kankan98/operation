CREATE TABLE `alert_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`rule_type` text NOT NULL,
	`condition` text NOT NULL,
	`threshold` real NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`severity` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
