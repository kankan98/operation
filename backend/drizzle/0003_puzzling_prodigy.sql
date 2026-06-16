CREATE TABLE `task_overviews` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`task_name` text NOT NULL,
	`status` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`related_products` text,
	`platform` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `is_pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `last_message_preview` text;--> statement-breakpoint
ALTER TABLE `chat_sessions` ADD `unread_count` integer DEFAULT 0 NOT NULL;