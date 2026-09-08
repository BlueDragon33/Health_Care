ALTER TABLE `site_access_devices` ADD COLUMN `detected_device_type` text DEFAULT 'desktop' NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `device_type_override` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `device_type_override_by` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `device_type_override_at` text;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `environment_changed` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `site_access_devices` ADD COLUMN `environment_change_reason` text;
--> statement-breakpoint
UPDATE `site_access_devices` SET `detected_device_type` = `device_type`;
--> statement-breakpoint
CREATE INDEX `site_access_devices_review_idx` ON `site_access_devices` (`environment_changed`,`classification_confidence`,`status`,`last_seen_at`);
