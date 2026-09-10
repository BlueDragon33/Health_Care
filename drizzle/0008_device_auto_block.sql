ALTER TABLE `site_device_automation` ADD COLUMN `auto_block_pending_devices` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_device_automation` ADD COLUMN `pending_block_after_hours` integer DEFAULT 168 NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_device_automation` ADD COLUMN `last_auto_block_run_at` text;
