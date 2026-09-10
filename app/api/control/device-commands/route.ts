import { controlPreflight, controlResponse, requireControlService, withControlCors } from "../../../control-auth.server";
import {
  DeviceAccessError,
  auditHealthControlEvent,
  deviceErrorResponse,
  getCourseDatabase,
  revokeSiteSessionsForDevice,
} from "../../../device-auth.server";

export const dynamic = "force-dynamic";
export function OPTIONS(request: Request) { return controlPreflight(request); }

type DeviceStatus = "pending" | "approved" | "blocked";
type DeviceCommandOperation = "approve" | "block";
type CommandRow = {
  command_id: string;
  device_id: string;
  operation: DeviceCommandOperation;
  expected_status: DeviceStatus;
  state: "processing" | "completed" | "failed" | "uncertain";
  result_status: DeviceStatus | null;
  actor: string;
  control_device_id: string | null;
  ticket_id: string | null;
  execution_nonce: string;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
};

type DeviceRow = {
  device_id: string;
  display_code: string;
  status: DeviceStatus;
};

function canManage(role: string) { return role === "publisher" || role === "owner"; }

function text(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validCommandId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function validDeviceId(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

async function commandRow(database: D1Database, commandId: string) {
  return database.prepare(
    `SELECT command_id, device_id, operation, expected_status, state, result_status, actor,
            control_device_id, ticket_id, execution_nonce, error_code, created_at, completed_at
       FROM health_control_commands
      WHERE command_id = ?`,
  ).bind(commandId).first<CommandRow>();
}

function assertCommandShape(row: CommandRow, deviceId: string, operation: DeviceCommandOperation, expectedStatus: DeviceStatus) {
  if (row.device_id !== deviceId || row.operation !== operation || row.expected_status !== expectedStatus) {
    throw new DeviceAccessError(
      "commandId đã được dùng cho một lệnh khác. Không được tái sử dụng commandId với payload mới.",
      409,
      "COMMAND_ID_CONFLICT",
    );
  }
}

function replayResponse(row: CommandRow, request: Request) {
  if (row.state === "completed" && row.result_status) {
    return controlResponse({
      ok: true,
      application: "health-care",
      commandId: row.command_id,
      deviceId: row.device_id,
      status: row.result_status,
      replayed: true,
      completedAt: row.completed_at,
    }, 200, request);
  }
  if (row.state === "uncertain") {
    throw new DeviceAccessError(
      "Lệnh trước có thể đã áp dụng nhưng chưa hoàn tất side-effect/audit. Cần đọc lại registry trước khi tạo lệnh mới.",
      409,
      "COMMAND_RECONCILIATION_REQUIRED",
    );
  }
  if (row.state === "failed") {
    throw new DeviceAccessError(
      "Lệnh cùng commandId đã thất bại và không được tự động chạy lại. Hãy đọc lại trạng thái rồi tạo commandId mới nếu vẫn cần thao tác.",
      409,
      "COMMAND_PREVIOUSLY_FAILED",
    );
  }
  throw new DeviceAccessError("Lệnh cùng commandId đang được xử lý.", 409, "COMMAND_IN_PROGRESS");
}

async function markCommandState(
  database: D1Database,
  commandId: string,
  executionNonce: string,
  state: "completed" | "failed" | "uncertain",
  resultStatus: DeviceStatus | null,
  errorCode: string | null,
) {
  await database.prepare(
    `UPDATE health_control_commands
        SET state = ?, result_status = ?, error_code = ?,
            completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE command_id = ? AND execution_nonce = ? AND state = 'processing'`,
  ).bind(state, resultStatus, errorCode, state, commandId, executionNonce).run();
}

export async function POST(request: Request) {
  try {
    const identity = await requireControlService(request);
    if (!canManage(identity.role)) {
      throw new DeviceAccessError("Không có quyền thay đổi thiết bị Sức khỏe Y tế.", 403, "PUBLISHER_REQUIRED");
    }

    const payload = await request.json() as Record<string, unknown>;
    const commandId = text(payload.commandId, 80).toLowerCase();
    const deviceId = text(payload.deviceId, 80).toLowerCase();
    const operation = text(payload.operation, 20) as DeviceCommandOperation;
    const expectedStatus = text(payload.expectedStatus, 20) as DeviceStatus;

    if (!validCommandId(commandId)) throw new DeviceAccessError("commandId không hợp lệ.", 400, "INVALID_COMMAND_ID");
    if (!validDeviceId(deviceId)) throw new DeviceAccessError("Mã thiết bị không hợp lệ.", 400, "INVALID_DEVICE");
    if (operation !== "approve" && operation !== "block") {
      throw new DeviceAccessError("Lệnh thiết bị không được hỗ trợ.", 400, "INVALID_DEVICE_COMMAND");
    }
    if (expectedStatus !== "pending" && expectedStatus !== "approved" && expectedStatus !== "blocked") {
      throw new DeviceAccessError("expectedStatus không hợp lệ.", 400, "INVALID_EXPECTED_STATUS");
    }
    if (operation === "approve" && expectedStatus !== "pending") {
      throw new DeviceAccessError("Duyệt chỉ được thực hiện từ trạng thái pending.", 409, "INVALID_APPROVE_TRANSITION");
    }
    if (operation === "block" && expectedStatus === "blocked") {
      throw new DeviceAccessError("Thiết bị đã blocked; không tạo lệnh block mới từ snapshot cũ.", 409, "INVALID_BLOCK_TRANSITION");
    }

    const database = await getCourseDatabase();
    const existing = await commandRow(database, commandId);
    if (existing) {
      assertCommandShape(existing, deviceId, operation, expectedStatus);
      return replayResponse(existing, request);
    }

    const executionNonce = crypto.randomUUID();
    await database.prepare(
      `INSERT OR IGNORE INTO health_control_commands
        (command_id, device_id, operation, expected_status, state, actor, control_device_id, ticket_id, execution_nonce)
       VALUES (?, ?, ?, ?, 'processing', ?, ?, ?, ?)`,
    ).bind(
      commandId,
      deviceId,
      operation,
      expectedStatus,
      identity.actor.trim().slice(0, 160) || "system",
      identity.controlDeviceId ?? null,
      identity.ticketId ?? null,
      executionNonce,
    ).run();

    const claimed = await commandRow(database, commandId);
    if (!claimed) throw new DeviceAccessError("Không thể ghi command ledger.", 500, "COMMAND_LEDGER_WRITE_FAILED");
    assertCommandShape(claimed, deviceId, operation, expectedStatus);
    if (claimed.execution_nonce !== executionNonce) return replayResponse(claimed, request);

    let applied = false;
    let targetStatus: DeviceStatus | null = null;
    try {
      const current = await database.prepare(
        "SELECT device_id, display_code, status FROM site_access_devices WHERE device_id = ?",
      ).bind(deviceId).first<DeviceRow>();
      if (!current) throw new DeviceAccessError("Không tìm thấy thiết bị.", 404, "DEVICE_NOT_FOUND");
      if (current.status !== expectedStatus) {
        throw new DeviceAccessError(
          `Snapshot thiết bị đã thay đổi: expected ${expectedStatus}, hiện tại ${current.status}.`,
          409,
          "DEVICE_STATE_CONFLICT",
        );
      }

      targetStatus = operation === "approve" ? "approved" : "blocked";
      const mutation = operation === "approve"
        ? await database.prepare(
          "UPDATE site_access_devices SET status = 'approved', approved_at = CURRENT_TIMESTAMP, blocked_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE device_id = ? AND status = ?",
        ).bind(deviceId, expectedStatus).run()
        : await database.prepare(
          "UPDATE site_access_devices SET status = 'blocked', blocked_at = CURRENT_TIMESTAMP, edit_enabled = 0, calendar_enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE device_id = ? AND status = ?",
        ).bind(deviceId, expectedStatus).run();

      if ((mutation.meta?.changes ?? 0) !== 1) {
        throw new DeviceAccessError("Thiết bị đã đổi trạng thái trong lúc xử lý lệnh.", 409, "DEVICE_STATE_RACE");
      }
      applied = true;

      const trace = {
        commandId,
        expectedStatus,
        resultStatus: targetStatus,
        deviceCode: current.display_code,
        controlDeviceId: identity.controlDeviceId,
        ticketId: identity.ticketId,
      };
      if (operation === "block") {
        await revokeSiteSessionsForDevice(deviceId, identity.actor, "Thiết bị bị khóa bởi idempotent control command");
      }
      await auditHealthControlEvent(
        identity.actor,
        operation === "approve" ? "site_device_approved_command" : "site_device_blocked_command",
        deviceId,
        trace,
      );
      await markCommandState(database, commandId, executionNonce, "completed", targetStatus, null);

      return controlResponse({
        ok: true,
        application: "health-care",
        commandId,
        deviceId,
        status: targetStatus,
        replayed: false,
      }, 200, request);
    } catch (error) {
      const errorCode = error instanceof DeviceAccessError ? error.code : "COMMAND_EXECUTION_FAILED";
      await markCommandState(database, commandId, executionNonce, applied ? "uncertain" : "failed", targetStatus, errorCode).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return withControlCors(request, deviceErrorResponse(error));
  }
}
