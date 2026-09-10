CREATE TABLE IF NOT EXISTS health_control_commands (
  command_id TEXT PRIMARY KEY NOT NULL,
  device_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  expected_status TEXT NOT NULL,
  state TEXT DEFAULT 'processing' NOT NULL,
  result_status TEXT,
  actor TEXT NOT NULL,
  control_device_id TEXT,
  ticket_id TEXT,
  execution_nonce TEXT NOT NULL,
  error_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS health_control_commands_device_idx
  ON health_control_commands(device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS health_control_commands_created_idx
  ON health_control_commands(created_at DESC);
