ALTER TABLE `site_access_devices` ADD COLUMN `installation_id` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `os_name` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `browser_version` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `mobile_hint` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `touch_points` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `viewport_width` integer;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `viewport_height` integer;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `pixel_ratio` real;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `pwa_mode` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `language` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `timezone` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `classification_confidence` text DEFAULT 'low' NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `classification_reason` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `metadata_updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;
--> statement-breakpoint
CREATE INDEX `site_access_devices_installation_idx` ON `site_access_devices` (`installation_id`);
--> statement-breakpoint
CREATE INDEX `site_access_devices_classification_idx` ON `site_access_devices` (`device_type`,`classification_confidence`,`status`,`last_seen_at`);
