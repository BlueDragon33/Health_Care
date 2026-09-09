import { auditHealthControlEvent, DeviceAccessError, getCourseDatabase } from "./device-auth.server";

export type HealthDeviceAutomationSettings = {
  autoApproveDevices: boolean;
  updatedBy: string | null;
  updatedAt: string;
};

type AutomationRow = {
  auto_approve_devices: number;
  updated_by: string | null;
  updated_at: string;
};

function state(row: AutomationRow): HealthDeviceAutomationSettings {
  return {
    autoApproveDevices: row.auto_approve_devices === 1,
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
      updated_by TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  ).run();
  await database.prepare(
    "INSERT OR IGNORE INTO site_device_automation (id, auto_approve_devices) VALUES (1, 0)",
  ).run();
  const row = await database.prepare(
    "SELECT auto_approve_devices, updated_by, updated_at FROM site_device_automation WHERE id = 1",
  ).first<AutomationRow>();
  if (!row) throw new DeviceAccessError("Không thể đọc cấu hình duyệt tự động Sức khỏe Y tế.", 503, "HEALTH_AUTOMATION_UNAVAILABLE");
  return state(row);
}

export async function updateHealthDeviceAutomationSettings(actor: string, payload: Record<string, unknown>) {
  const current = await getHealthDeviceAutomationSettings();
  const nextAutoApprove = typeof payload.autoApproveDevices === "boolean"
    ? payload.autoApproveDevices
    : current.autoApproveDevices;
  const database = await getCourseDatabase();
  await database.prepare(
    `UPDATE site_device_automation
        SET auto_approve_devices = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
  ).bind(nextAutoApprove ? 1 : 0, actor.trim().slice(0, 160) || "system").run();
  await auditHealthControlEvent(actor, "site_device_auto_approval_updated", "health-care", {
    autoApproveDevices: nextAutoApprove,
  });
  return getHealthDeviceAutomationSettings();
}
