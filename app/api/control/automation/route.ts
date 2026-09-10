import { controlPreflight, controlResponse, requireControlService, withControlCors } from "../../../control-auth.server";
import { DeviceAccessError, deviceErrorResponse } from "../../../device-auth.server";
import { getHealthDeviceAutomationSettings, updateHealthDeviceAutomationSettings } from "../../../device-automation.server";

export const dynamic = "force-dynamic";
export function OPTIONS(request: Request) { return controlPreflight(request); }

export async function GET(request: Request) {
  try {
    await requireControlService(request);
    return controlResponse({ application: "health-care", automation: await getHealthDeviceAutomationSettings() }, 200, request);
  } catch (error) {
    return withControlCors(request, deviceErrorResponse(error));
  }
}

export async function POST(request: Request) {
  try {
    const identity = await requireControlService(request);
    if (identity.role !== "owner") throw new DeviceAccessError("Chỉ Chủ hệ thống được đổi quy tắc tự động xử lý thiết bị Sức khỏe Y tế.", 403, "OWNER_REQUIRED");
    const payload = (await request.json()) as Record<string, unknown>;
    const automation = await updateHealthDeviceAutomationSettings(identity.actor, payload);
    return controlResponse({ application: "health-care", automation }, 200, request);
  } catch (error) {
    return withControlCors(request, deviceErrorResponse(error));
  }
}
