CREATE TABLE `daily_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`time` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `daily_schedule_sort_order_idx` ON `daily_schedule` (`sort_order`);--> statement-breakpoint
CREATE INDEX `daily_schedule_time_idx` ON `daily_schedule` (`time`);