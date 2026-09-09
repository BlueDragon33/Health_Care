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
