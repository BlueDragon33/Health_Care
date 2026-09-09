CREATE TABLE IF NOT EXISTS `site_device_automation` (
  `id` integer PRIMARY KEY NOT NULL CHECK (`id` = 1),
  `auto_approve_devices` integer DEFAULT 0 NOT NULL,
  `updated_by` text,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `site_device_automation` (`id`, `auto_approve_devices`) VALUES (1, 0);
