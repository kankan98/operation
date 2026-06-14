CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tool_calls` text,
	`tool_results` text,
	`tokens_used` integer,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`user_id` text,
	`context_summary` text,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
