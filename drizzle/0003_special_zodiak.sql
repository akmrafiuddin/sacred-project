CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`date` text NOT NULL,
	`kind` text DEFAULT 'special_puja' NOT NULL,
	`title` text NOT NULL,
	`label` text,
	`time` text,
	`description` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `events` (`date`);--> statement-breakpoint
CREATE INDEX `events_slug_idx` ON `events` (`slug`);