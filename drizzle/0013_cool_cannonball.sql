CREATE TABLE `visitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref` text NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`visit_date` text NOT NULL,
	`time_slot` text DEFAULT 'morning' NOT NULL,
	`visitor_count` integer DEFAULT 1 NOT NULL,
	`purpose` text DEFAULT 'general_darshan' NOT NULL,
	`special_needs` text,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`check_in_at` integer,
	`handled_by` text,
	`admin_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visitations_ref_unique` ON `visitations` (`ref`);--> statement-breakpoint
CREATE INDEX `visitations_ref_idx` ON `visitations` (`ref`);--> statement-breakpoint
CREATE INDEX `visitations_user_id_idx` ON `visitations` (`user_id`);--> statement-breakpoint
CREATE INDEX `visitations_date_idx` ON `visitations` (`visit_date`);--> statement-breakpoint
CREATE INDEX `visitations_status_idx` ON `visitations` (`status`);--> statement-breakpoint
CREATE INDEX `visitations_slot_idx` ON `visitations` (`time_slot`);--> statement-breakpoint
ALTER TABLE `puja_bookings` ADD `puja_type` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `puja_bookings` ADD `custom_puja_name` text;--> statement-breakpoint
ALTER TABLE `puja_bookings` ADD `custom_dakshina` integer;--> statement-breakpoint
ALTER TABLE `puja_bookings` ADD `special_instructions` text;--> statement-breakpoint
CREATE INDEX `puja_bookings_type_idx` ON `puja_bookings` (`puja_type`);