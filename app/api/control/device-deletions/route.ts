import { controlPreflight, controlResponse, requireControlService, withControlCors } from "../../../control-auth.server";
import { getCourseDatabase, auditHealthControlEvent, deviceErrorResponse } from "../../../device-auth.server";
import { deletePendingRegistration, PendingDeviceDeletionError } from "../../../pending-device-deletion.server";

export const dynamic = "force-dynamic";
export function OPTIONS(request: Request) { return controlPreflight(request); }
export async function POST(request: Request) {
  try {
    const identity = await requireControlService(request);
    if (identity.role !== "owner") throw new PendingDeviceDeletionError("Chỉ Chủ hệ thống được xóa hồ sơ đăng ký.", 403, "OWNER_REQUIRED");
    const database = await getCourseDatabase();
    const result = await deletePendingRegistration(database, "site_access_devices", await request.json() as Record<string, unknown>);
    if (!result.alreadyAbsent) { await auditHealthControlEvent(identity.actor, "pending_device_deleted", result.deviceId, { deviceCode: result.deviceCode, controlDeviceId: identity.controlDeviceId }); }
    return controlResponse(result, 200, request);
  } catch (error) {
    if (error instanceof PendingDeviceDeletionError) return controlResponse({ error: error.message, code: error.code }, error.status, request);
    return withControlCors(request, deviceErrorResponse(error));
  }
}
