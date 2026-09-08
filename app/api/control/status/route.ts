import { controlPreflight, controlResponse, requireControlService, withControlCors } from "../../../control-auth.server";
import { deviceErrorResponse, getHealthControlStatus } from "../../../device-auth.server";

export const dynamic = "force-dynamic";
export function OPTIONS(request: Request) { return controlPreflight(request); }

async function buildIdentity() {
  const workers = await import("cloudflare:workers");
  const values = workers.env as unknown as Record<string, unknown>;
  const revision = typeof values.HEALTH_BUILD_REVISION === "string" ? values.HEALTH_BUILD_REVISION.trim().slice(0, 64) : "";
  const source = typeof values.HEALTH_BUILD_SOURCE === "string" ? values.HEALTH_BUILD_SOURCE.trim().slice(0, 120) : "";
  return {
    buildRevision: revision || null,
    buildSource: source || "BlueDragon33/Health_Care",
  };
}

export async function GET(request: Request) {
  try {
    await requireControlService(request);
    const [status, build] = await Promise.all([getHealthControlStatus(), buildIdentity()]);
    return controlResponse({ ...status, ...build }, 200, request);
  } catch (error) {
    return withControlCors(request, deviceErrorResponse(error));
  }
}
