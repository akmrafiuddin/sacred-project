CREATE TABLE `pujas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`offered` text,
	`price_bdt` integer DEFAULT 0 NOT NULL,
	`duration` text,
	`bookable` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pujas_slug_unique` ON `pujas` (`slug`);--> statement-breakpoint
CREATE INDEX `pujas_slug_idx` ON `pujas` (`slug`);--> statement-breakpoint
CREATE INDEX `pujas_sort_order_idx` ON `pujas` (`sort_order`);