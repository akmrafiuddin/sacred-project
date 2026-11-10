CREATE TABLE `puja_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref` text NOT NULL,
	`user_id` text,
	`puja_id` integer,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`gotra` text,
	`preferred_date` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'new' NOT NULL,
	`handled_by` text,
	`admin_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`puja_id`) REFERENCES `pujas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `puja_bookings_ref_unique` ON `puja_bookings` (`ref`);--> statement-breakpoint
CREATE INDEX `puja_bookings_ref_idx` ON `puja_bookings` (`ref`);--> statement-breakpoint
CREATE INDEX `puja_bookings_user_id_idx` ON `puja_bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `puja_bookings_status_idx` ON `puja_bookings` (`status`);--> statement-breakpoint
CREATE INDEX `puja_bookings_pref_date_idx` ON `puja_bookings` (`preferred_date`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`admin_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contact_messages_status_idx` ON `contact_messages` (`status`);--> statement-breakpoint
CREATE INDEX `contact_messages_created_at_idx` ON `contact_messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `volunteers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`area` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'new' NOT NULL,
	`admin_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `volunteers_status_idx` ON `volunteers` (`status`);--> statement-breakpoint
CREATE INDEX `volunteers_area_idx` ON `volunteers` (`area`);--> statement-breakpoint
CREATE INDEX `volunteers_created_at_idx` ON `volunteers` (`created_at`);