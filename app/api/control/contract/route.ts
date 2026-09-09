import { HEALTH_MANAGEMENT_CONTRACT } from "../../../health-management-contract";

export const dynamic = "force-dynamic";

function headers() {
  return {
    "cache-control": "public, max-age=300, must-revalidate",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
  };
}

export async function GET(request: Request) {
  const siteOrigin = new URL(request.url).origin;
  return Response.json({
    ...HEALTH_MANAGEMENT_CONTRACT,
    siteOrigin,
    publishedAt: new Date().toISOString(),
  }, { headers: headers() });
}
