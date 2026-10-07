import type { ControlServiceIdentity } from "./control-auth.server";
import { auditHealthControlEvent, DeviceAccessError, getCourseDatabase } from "./device-auth.server";

const ALLOWED_PENDING_BLOCK_HOURS = new Set([24, 168, 720]);

export type HealthDeviceAutomationSettings = {
  autoApproveDevices: boolean;
  autoBlockPendingDevices: boolean;
  pendingBlockAfterHours: number;
  revision: number;
  lastAutoBlockRunAt: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

type AutomationRow = {
  auto_approve_devices: number;
  auto_block_pending_devices: number;
  pending_block_after_hours: number;
  revision: number;
  last_auto_block_run_at: string | null;
  updated_by: string | null;
  updated_at: string;
};

type AutomationCommandRow = {
  command_id: string;
  payload_hash: string;
  state: "processing" | "completed" | "failed" | "uncertain";
  result_json: string | null;
  actor: string;
  control_device_id: string | null;
  ticket_id: string | null;
  execution_nonce: string;
  error_code: string | null;
};

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizedPendingBlockHours(value: unknown, fallback = 168) {
  const hours = Math.round(Number(value));
  return ALLOWED_PENDING_BLOCK_HOURS.has(hours) ? hours : fallback;
}

function strictPendingBlockHours(value: unknown) {
  const hours = Math.round(Number(value));
  return ALLOWED_PENDING_BLOCK_HOURS.has(hours) ? hours : null;
}

function state(row: AutomationRow): HealthDeviceAutomationSettings {
  return {
    autoApproveDevices: row.auto_approve_devices === 1,
    autoBlockPendingDevices: row.auto_block_pending_devices === 1,
    pendingBlockAfterHours: normalizedPendingBlockHours(row.pending_block_after_hours),
    revision: Number(row.revision) || 1,
    lastAutoBlockRunAt: row.last_auto_block_run_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function validCommandId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getHealthDeviceAutomationSettings() {
  const database = await getCourseDatabase();
  await database.prepare(
    `CREATE TABLE IF NOT EXISTS site_device_automation (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      auto_approve_devices INTEGER DEFAULT 0 NOT NULL,
      auto_block_pending_devices INTEGER DEFAULT 0 NOT NULL,
      pending_block_after_hours INTEGER DEFAULT 168 NOT NULL,
      revision INTEGER DEFAULT 1 NOT NULL,
      last_auto_block_run_at TEXT,
      updated_by TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  ).run();
  await database.prepare(
    "INSERT OR IGNORE INTO site_device_automation (id, auto_approve_devices, auto_block_pending_devices, pending_block_after_hours, revision) VALUES (1, 0, 0, 168, 1)",
  ).run();
  const row = await database.prepare(
    `SELECT auto_approve_devices, auto_block_pending_devices, pending_block_after_hours, revision,
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
            revision = revision + 1, updated_by = ?, updated_at = CURRENT_TIMESTAMP
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

async function commandRow(database: D1Database, commandId: string) {
  return database.prepare(
    `SELECT command_id,payload_hash,state,result_json,actor,control_device_id,ticket_id,execution_nonce,error_code
       FROM health_automation_commands WHERE command_id=?`,
  ).bind(commandId).first<AutomationCommandRow>();
}

function expectedMatches(current: HealthDeviceAutomationSettings, expected: Record<string, unknown>, desired: Record<string, unknown>) {
  if ("autoApproveDevices" in desired && (typeof expected.autoApproveDevices !== "boolean" || expected.autoApproveDevices !== current.autoApproveDevices)) return false;
  if ("autoBlockPendingDevices" in desired && (typeof expected.autoBlockPendingDevices !== "boolean" || expected.autoBlockPendingDevices !== current.autoBlockPendingDevices)) return false;
  if ("pendingBlockAfterHours" in desired) {
    const hours = strictPendingBlockHours(expected.pendingBlockAfterHours);
    if (!hours || hours !== current.pendingBlockAfterHours) return false;
  }
  return true;
}

function desiredPolicy(current: HealthDeviceAutomationSettings, desired: Record<string, unknown>) {
  const hasApprove = "autoApproveDevices" in desired;
  const hasBlock = "autoBlockPendingDevices" in desired;
  const hasHours = "pendingBlockAfterHours" in desired;
  if (!hasApprove && !hasBlock && !hasHours) throw new DeviceAccessError("Automation command không có thay đổi.", 400, "AUTOMATION_DESIRED_EMPTY");
  if (hasApprove && typeof desired.autoApproveDevices !== "boolean") throw new DeviceAccessError("autoApproveDevices không hợp lệ.", 400, "INVALID_AUTO_APPROVE");
  if (hasBlock && typeof desired.autoBlockPendingDevices !== "boolean") throw new DeviceAccessError("autoBlockPendingDevices không hợp lệ.", 400, "INVALID_AUTO_BLOCK");
  const hours = hasHours ? strictPendingBlockHours(desired.pendingBlockAfterHours) : current.pendingBlockAfterHours;
  if (!hours) throw new DeviceAccessError("pendingBlockAfterHours phải là 24, 168 hoặc 720.", 400, "INVALID_AUTO_BLOCK_THRESHOLD");
  return {
    autoApproveDevices: hasApprove ? desired.autoApproveDevices === true : current.autoApproveDevices,
    autoBlockPendingDevices: hasBlock ? desired.autoBlockPendingDevices === true : current.autoBlockPendingDevices,
    pendingBlockAfterHours: hours,
  };
}

export async function executeHealthDeviceAutomationCommand(identity: ControlServiceIdentity, payload: Record<string, unknown>) {
  if (identity.role !== "owner") throw new DeviceAccessError("Chỉ Chủ hệ thống được đổi automation policy Sức khỏe Y tế.", 403, "OWNER_REQUIRED");
  const commandId = typeof payload.commandId === "string" ? payload.commandId.trim().toLowerCase() : "";
  if (!validCommandId(commandId)) throw new DeviceAccessError("commandId automation không hợp lệ.", 400, "INVALID_COMMAND_ID");
  if (payload.operation !== "set-device-automation") throw new DeviceAccessError("Automation operation không hợp lệ.", 400, "INVALID_AUTOMATION_OPERATION");

  const expected = record(payload.expected);
  const desired = record(payload.desired);
  const requested = {
    ...("autoApproveDevices" in desired ? { autoApproveDevices: desired.autoApproveDevices } : {}),
    ...("autoBlockPendingDevices" in desired ? { autoBlockPendingDevices: desired.autoBlockPendingDevices } : {}),
    ...("pendingBlockAfterHours" in desired ? { pendingBlockAfterHours: strictPendingBlockHours(desired.pendingBlockAfterHours) } : {}),
  };
  const canonical = JSON.stringify({
    operation: "set-device-automation",
    expected: {
      ...("autoApproveDevices" in desired ? { autoApproveDevices: expected.autoApproveDevices } : {}),
      ...("autoBlockPendingDevices" in desired ? { autoBlockPendingDevices: expected.autoBlockPendingDevices } : {}),
      ...("pendingBlockAfterHours" in desired ? { pendingBlockAfterHours: strictPendingBlockHours(expected.pendingBlockAfterHours) } : {}),
    },
    desired: requested,
  });
  const payloadHash = await sha256Hex(canonical);
  const database = await getCourseDatabase();

  const prior = await commandRow(database, commandId);
  if (prior) {
    if (prior.payload_hash !== payloadHash) throw new DeviceAccessError("commandId automation đã được dùng cho payload khác.", 409, "COMMAND_ID_PAYLOAD_MISMATCH");
    if (prior.state === "completed" && prior.result_json) {
      return { commandId, replayed: true, automation: JSON.parse(prior.result_json) as HealthDeviceAutomationSettings };
    }
    if (prior.state === "uncertain") throw new DeviceAccessError("Lệnh automation trước cần đối chiếu lại trước khi chạy lệnh mới.", 409, "COMMAND_RECONCILIATION_REQUIRED");
    if (prior.state === "failed") throw new DeviceAccessError("Lệnh automation cùng commandId đã thất bại; cần đọc lại policy rồi tạo commandId mới.", 409, "COMMAND_PREVIOUSLY_FAILED");
    throw new DeviceAccessError("Lệnh automation cùng commandId đang được xử lý.", 409, "COMMAND_IN_PROGRESS");
  }

  const current = await getHealthDeviceAutomationSettings();
  if (!expectedMatches(current, expected, desired)) {
    throw new DeviceAccessError("Automation policy đã thay đổi trước khi lệnh được áp dụng.", 409, "AUTOMATION_STATE_CONFLICT");
  }
  const next = desiredPolicy(current, desired);
  const executionNonce = crypto.randomUUID();

  await database.prepare(
    `INSERT INTO health_automation_commands
      (command_id,payload_hash,state,actor,control_device_id,ticket_id,execution_nonce)
     VALUES (?,?,'processing',?,?,?,?)`,
  ).bind(
    commandId,
    payloadHash,
    identity.actor.trim().slice(0, 160) || "system",
    identity.controlDeviceId,
    identity.ticketId,
    executionNonce,
  ).run();

  try {
    const mutation = await database.prepare(
      `UPDATE site_device_automation
          SET auto_approve_devices=?, auto_block_pending_devices=?, pending_block_after_hours=?,
              revision=revision+1, updated_by=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=1 AND revision=?`,
    ).bind(
      next.autoApproveDevices ? 1 : 0,
      next.autoBlockPendingDevices ? 1 : 0,
      next.pendingBlockAfterHours,
      identity.actor.trim().slice(0, 160) || "system",
      current.revision,
    ).run();
    if (Number(mutation.meta.changes ?? 0) !== 1) {
      await database.prepare(
        "UPDATE health_automation_commands SET state='failed',error_code='AUTOMATION_STATE_CONFLICT' WHERE command_id=? AND execution_nonce=?",
      ).bind(commandId, executionNonce).run();
      throw new DeviceAccessError("Automation policy đã thay đổi trước khi ghi.", 409, "AUTOMATION_STATE_CONFLICT");
    }

    const updated = await getHealthDeviceAutomationSettings();
    for (const key of Object.keys(desired)) {
      if (key === "autoApproveDevices" && updated.autoApproveDevices !== next.autoApproveDevices
        || key === "autoBlockPendingDevices" && updated.autoBlockPendingDevices !== next.autoBlockPendingDevices
        || key === "pendingBlockAfterHours" && updated.pendingBlockAfterHours !== next.pendingBlockAfterHours) {
        throw new DeviceAccessError("Automation policy chưa xác nhận readback.", 502, "AUTOMATION_READBACK_MISMATCH");
      }
    }

    await auditHealthControlEvent(identity.actor, "site_device_automation_command_applied", "health-care", {
      commandId,
      expected,
      desired,
      result: updated,
      controlDeviceId: identity.controlDeviceId,
    });
    await database.prepare(
      "UPDATE health_automation_commands SET state='completed',result_json=?,completed_at=CURRENT_TIMESTAMP WHERE command_id=? AND execution_nonce=?",
    ).bind(JSON.stringify(updated), commandId, executionNonce).run();
    return { commandId, replayed: false, automation: updated };
  } catch (error) {
    if (!(error instanceof DeviceAccessError && error.code === "AUTOMATION_STATE_CONFLICT")) {
      try {
        await database.prepare(
          "UPDATE health_automation_commands SET state='uncertain',error_code='COMMAND_REQUIRES_RECONCILIATION' WHERE command_id=? AND execution_nonce=? AND state='processing'",
        ).bind(commandId, executionNonce).run();
      } catch {
        // Never blind-replay an unresolved automation command.
      }
    }
    throw error;
  }
}
