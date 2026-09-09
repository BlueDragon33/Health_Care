CREATE TABLE IF NOT EXISTS `health_control_web_launch` (
  `ticket_id` text PRIMARY KEY NOT NULL,
  `actor` text NOT NULL,
  `control_device_id` text NOT NULL,
  `consumed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `health_control_web_launch_consumed_idx` ON `health_control_web_launch` (`consumed_at`);
