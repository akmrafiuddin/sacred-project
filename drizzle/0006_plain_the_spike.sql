CREATE TABLE `deities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`subtitle` text,
	`description` text NOT NULL,
	`image_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deities_slug_unique` ON `deities` (`slug`);--> statement-breakpoint
CREATE INDEX `deities_slug_idx` ON `deities` (`slug`);--> statement-breakpoint
CREATE INDEX `deities_sort_order_idx` ON `deities` (`sort_order`);