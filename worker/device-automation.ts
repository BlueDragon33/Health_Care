const AUTO_BLOCK_ACTOR = "health-device-automation";
const MAX_DEVICES_PER_RUN = 50;
const ALLOWED_PENDING_BLOCK_HOURS = new Set([24, 168, 720]);

type AutomationRow = {
  auto_block_pending_devices: number;
  pending_block_after_hours: number;
};

type PendingDeviceRow = {
  device_id: string;
  display_code: string;
  created_at: string;
};

export type HealthDeviceAutomationSweepResult = {
  enabled: boolean;
  pendingBlockAfterHours: number;
  scanned: number;
  blocked: number;
  skipped: number;
};

function normalizedHours(value: number) {
  return ALLOWED_PENDING_BLOCK_HOURS.has(value) ? value : 168;
}

export async function runHealthDeviceAutomationSweep(
  database: D1Database,
  nowMs = Date.now(),
): Promise<HealthDeviceAutomationSweepResult> {
  const automation = await database.prepare(
    `SELECT auto_block_pending_devices, pending_block_after_hours
       FROM site_device_automation WHERE id = 1`,
  ).first<AutomationRow>();

  const pendingBlockAfterHours = normalizedHours(Number(automation?.pending_block_after_hours ?? 168));
  if (automation?.auto_block_pending_devices !== 1) {
    return { enabled: false, pendingBlockAfterHours, scanned: 0, blocked: 0, skipped: 0 };
  }

  const cutoffUnixSeconds = Math.floor((nowMs - pendingBlockAfterHours * 60 * 60 * 1000) / 1000);
  const candidates = await database.prepare(
    `SELECT device_id, display_code, created_at
       FROM site_access_devices
      WHERE status = 'pending'
        AND datetime(created_at) <= datetime(?, 'unixepoch')
      ORDER BY created_at ASC
      LIMIT ?`,
  ).bind(cutoffUnixSeconds, MAX_DEVICES_PER_RUN).all<PendingDeviceRow>();

  let blocked = 0;
  let skipped = 0;
  for (const device of candidates.results) {
    const update = await database.prepare(
      `UPDATE site_access_devices
          SET status = 'blocked', blocked_at = CURRENT_TIMESTAMP,
              edit_enabled = 0, calendar_enabled = 0, updated_at = CURRENT_TIMESTAMP
        WHERE device_id = ? AND status = 'pending'`,
    ).bind(device.device_id).run();

    if (Number(update.meta.changes ?? 0) < 1) {
      skipped += 1;
      continue;
    }

    await database.prepare(
      `UPDATE site_access_sessions
          SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP,
              revoked_by = ?, revoke_reason = 'Tự động khóa do yêu cầu thiết bị chờ quá hạn'
        WHERE device_id = ? AND status = 'active'`,
    ).bind(AUTO_BLOCK_ACTOR, device.device_id).run();

    await database.prepare(
      `INSERT INTO course_audit_log (actor, action, target, detail_json)
       VALUES (?, 'site_device_auto_blocked', ?, ?)`,
    ).bind(
      AUTO_BLOCK_ACTOR,
      device.device_id,
      JSON.stringify({
        application: "health-care",
        deviceCode: device.display_code,
        reason: "pending-timeout",
        pendingBlockAfterHours,
        createdAt: device.created_at,
      }),
    ).run();
    blocked += 1;
  }

  await database.prepare(
    `UPDATE site_device_automation
        SET last_auto_block_run_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
  ).run();

  return {
    enabled: true,
    pendingBlockAfterHours,
    scanned: candidates.results.length,
    blocked,
    skipped,
  };
}
