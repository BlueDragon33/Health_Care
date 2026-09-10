import { auditHealthControlEvent, DeviceAccessError, getCourseDatabase } from "./device-auth.server";

const ALLOWED_PENDING_BLOCK_HOURS = new Set([24, 168, 720]);

export type HealthDeviceAutomationSettings = {
  autoApproveDevices: boolean;
  autoBlockPendingDevices: boolean;
  pendingBlockAfterHours: number;
  lastAutoBlockRunAt: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

type AutomationRow = {
  auto_approve_devices: number;
  auto_block_pending_devices: number;
  pending_block_after_hours: number;
  last_auto_block_run_at: string | null;
  updated_by: string | null;
  updated_at: string;
};

function normalizedPendingBlockHours(value: unknown, fallback = 168) {
  const hours = Math.round(Number(value));
  return ALLOWED_PENDING_BLOCK_HOURS.has(hours) ? hours : fallback;
}

function state(row: AutomationRow): HealthDeviceAutomationSettings {
  return {
    autoApproveDevices: row.auto_approve_devices === 1,
    autoBlockPendingDevices: row.auto_block_pending_devices === 1,
    pendingBlockAfterHours: normalizedPendingBlockHours(row.pending_block_after_hours),
    lastAutoBlockRunAt: row.last_auto_block_run_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export async function getHealthDeviceAutomationSettings() {
  const database = await getCourseDatabase();
  await database.prepare(
    `CREATE TABLE IF NOT EXISTS site_device_automation (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      auto_approve_devices INTEGER DEFAULT 0 NOT NULL,
      auto_block_pending_devices INTEGER DEFAULT 0 NOT NULL,
      pending_block_after_hours INTEGER DEFAULT 168 NOT NULL,
      last_auto_block_run_at TEXT,
      updated_by TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  ).run();
  await database.prepare(
    "INSERT OR IGNORE INTO site_device_automation (id, auto_approve_devices, auto_block_pending_devices, pending_block_after_hours) VALUES (1, 0, 0, 168)",
  ).run();
  const row = await database.prepare(
    `SELECT auto_approve_devices, auto_block_pending_devices, pending_block_after_hours,
            last_auto_block_run_at, updated_by, updated_at
       FROM site_device_automation WHERE id = 1`,
  ).first<AutomationRow>();
  if (!row) throw new DeviceAccessError("Không thể đọc cấu hình tự động xử lý thiết bị Sức khỏe Y tế.", 503, "HEALTH_AUTOMATION_UNAVAILABLE");
  return state(row);
}

export async function updateHealthDeviceAutomationSettings(actor: string, payload: Record<string, unknown>) {
  const current = await getHealthDeviceAutomationSettings();
  const nextAutoApprove = typeof payload.autoApproveDevices === "boolean"
    ? payload.autoApproveDevices
    : current.autoApproveDevices;
  const nextAutoBlock = typeof payload.autoBlockPendingDevices === "boolean"
    ? payload.autoBlockPendingDevices
    : current.autoBlockPendingDevices;
  const nextPendingBlockAfterHours = payload.pendingBlockAfterHours === undefined
    ? current.pendingBlockAfterHours
    : normalizedPendingBlockHours(payload.pendingBlockAfterHours, current.pendingBlockAfterHours);
  const database = await getCourseDatabase();
  await database.prepare(
    `UPDATE site_device_automation
        SET auto_approve_devices = ?, auto_block_pending_devices = ?, pending_block_after_hours = ?,
            updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
  ).bind(
    nextAutoApprove ? 1 : 0,
    nextAutoBlock ? 1 : 0,
    nextPendingBlockAfterHours,
    actor.trim().slice(0, 160) || "system",
  ).run();

  if (nextAutoApprove !== current.autoApproveDevices) {
    await auditHealthControlEvent(actor, "site_device_auto_approval_updated", "health-care", {
      autoApproveDevices: nextAutoApprove,
    });
  }
  if (
    nextAutoBlock !== current.autoBlockPendingDevices
    || nextPendingBlockAfterHours !== current.pendingBlockAfterHours
  ) {
    await auditHealthControlEvent(actor, "site_device_auto_block_updated", "health-care", {
      autoBlockPendingDevices: nextAutoBlock,
      pendingBlockAfterHours: nextPendingBlockAfterHours,
    });
  }
  return getHealthDeviceAutomationSettings();
}
