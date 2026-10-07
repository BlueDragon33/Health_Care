import { HEALTH_UNIVERSAL_MANAGEMENT_CONTRACT } from "../../../health-management-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(HEALTH_UNIVERSAL_MANAGEMENT_CONTRACT, {
    headers: {
      "cache-control": "public, max-age=300, must-revalidate",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}
