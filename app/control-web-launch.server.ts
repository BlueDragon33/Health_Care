import { DeviceAccessError, getCourseDatabase } from "./device-auth.server";

export type HealthControlWebLaunchIdentity = {
  actor: string;
  role: string;
  controlDeviceId: string;
  ticketId: string;
};

export async function consumeHealthControlWebLaunch(identity: HealthControlWebLaunchIdentity) {
  const database = await getCourseDatabase();
  await database.prepare(
    `CREATE TABLE IF NOT EXISTS health_control_web_launch (
      ticket_id TEXT PRIMARY KEY NOT NULL,
      actor TEXT NOT NULL,
      control_device_id TEXT NOT NULL,
      consumed_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  ).run();
  const existing = await database.prepare(
    "SELECT ticket_id FROM health_control_web_launch WHERE ticket_id = ?",
  ).bind(identity.ticketId).first<{ ticket_id: string }>();
  if (existing) {
    throw new DeviceAccessError("Vé mở Web Sức khỏe Y tế đã được sử dụng.", 409, "CONTROL_WEB_LAUNCH_REPLAY");
  }
  try {
    await database.prepare(
      "INSERT INTO health_control_web_launch (ticket_id, actor, control_device_id) VALUES (?, ?, ?)",
    ).bind(identity.ticketId, identity.actor, identity.controlDeviceId).run();
  } catch {
    throw new DeviceAccessError("Vé mở Web Sức khỏe Y tế đã được sử dụng.", 409, "CONTROL_WEB_LAUNCH_REPLAY");
  }
}

export async function promoteHealthControlWebLaunchDevice(deviceId: string, identity: HealthControlWebLaunchIdentity) {
  if (!/^[a-f0-9]{64}$/.test(deviceId)) {
    throw new DeviceAccessError("Mã thiết bị Sức khỏe Y tế không hợp lệ.", 400, "INVALID_DEVICE");
  }
  const database = await getCourseDatabase();
  await database.prepare(
    `UPDATE site_access_devices
        SET status = 'approved', approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP), blocked_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE device_id = ? AND status = 'pending'`,
  ).bind(deviceId).run();

  const current = await database.prepare(
    "SELECT status, display_code FROM site_access_devices WHERE device_id = ?",
  ).bind(deviceId).first<{ status: string; display_code: string }>();
  if (!current) {
    throw new DeviceAccessError("Không tìm thấy thiết bị sau khi xử lý vé mở Web.", 404, "DEVICE_NOT_FOUND");
  }
  if (current.status === "blocked") {
    throw new DeviceAccessError("Thiết bị này đã bị Trung tâm khóa; vé mở Web không được phép tự mở khóa.", 403, "DEVICE_BLOCKED");
  }
  if (current.status !== "approved") {
    throw new DeviceAccessError("Không thể cấp quyền cho thiết bị từ vé mở Web.", 409, "CONTROL_WEB_LAUNCH_DEVICE_NOT_APPROVED");
  }
  return { deviceId, deviceCode: current.display_code, status: "approved" as const, actor: identity.actor };
}
