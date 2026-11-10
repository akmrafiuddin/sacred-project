CREATE TABLE `notices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`date` text NOT NULL,
	`body` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notices_slug_unique` ON `notices` (`slug`);--> statement-breakpoint
CREATE INDEX `notices_slug_idx` ON `notices` (`slug`);--> statement-breakpoint
CREATE INDEX `notices_date_idx` ON `notices` (`date`);--> statement-breakpoint
CREATE INDEX `notices_pinned_idx` ON `notices` (`pinned`);