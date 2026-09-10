import fs from "node:fs";

const required = {
  "app/suc-khoe-tre/device-gate.tsx": [
    "installationId",
    "maxTouchPoints",
    "screenWidth",
    "screenHeight",
    "viewportWidth",
    "viewportHeight",
    "pwaMode",
    "timezone",
  ],
  "app/device-auth.server.ts": [
    "classificationConfidence",
    "classificationReason",
    "installationId",
    "osName",
    "browserVersion",
    "touchPoints",
    "mobileHint",
    "pwaMode",
    "detectedDeviceType",
    "deviceTypeOverride",
    "environmentChanged",
    "site_device_environment_changed",
    "canonicalApplication",
    "suc-khoe-y-te",
    "applicationAliases",
    "controlProtocol",
    "health-control-plane",
    "capabilities",
    "device-review-v1",
    "healthDataInControlPlane",
  ],
  "app/control-auth.server.ts": [
    "HEALTH_CONTROL_SERVICE_SECRET",
    "HEALTH_CONTROL_SECRET_UNCONFIGURED",
    "getControlSecretScope",
  ],
  "app/api/control/status/route.ts": [
    "HEALTH_BUILD_REVISION",
    "HEALTH_BUILD_SOURCE",
    "buildRevision",
    "buildSource",
    "app-scoped-secret-v1",
    "controlAuth",
    "secretScope",
  ],
  ".github/workflows/deploy.yml": [
    "workflow_dispatch",
    "HEALTH_PREVIEW_D1_DATABASE_ID",
    "HEALTH_CONTROL_SERVICE_SECRET",
    "cloudflare:preview:prepare",
  ],
  "wrangler.cloudflare.preview.example.jsonc": [
    "HEALTH_BUILD_REVISION",
    "HEALTH_BUILD_SOURCE",
    "BlueDragon33/Health_Care",
  ],
  "app/api/control/devices/route.ts": [
    "classificationConfidence",
    "classificationReason",
    "installationId",
    "osName",
    "browserVersion",
    "pwaMode",
    "autoLabel",
    "detectedDeviceType",
    "deviceTypeOverride",
    "set-device-type",
    "clear-device-type",
    "ack-environment",
  ],
  "drizzle/0004_device_metadata_v2.sql": [
    "installation_id",
    "os_name",
    "browser_version",
    "classification_confidence",
    "classification_reason",
    "metadata_updated_at",
  ],
  "drizzle/0005_device_management_review.sql": [
    "detected_device_type",
    "device_type_override",
    "device_type_override_by",
    "environment_changed",
    "environment_change_reason",
  ],
};

for (const [file, tokens] of Object.entries(required)) {
  const text = fs.readFileSync(file, "utf8");
  for (const token of tokens) {
    if (!text.includes(token)) throw new Error(`${file} thiếu contract: ${token}`);
  }
}

const controlAuth = fs.readFileSync("app/control-auth.server.ts", "utf8");
if (/values\.CONTROL_SERVICE_SECRET/.test(controlAuth) || controlAuth.includes("legacy-global")) {
  throw new Error("Health_Care không được fallback sang CONTROL_SERVICE_SECRET dùng chung.");
}

console.log("Device management V3 PASS: classification, review, canonical identity, capabilities, dedicated Health control secret and Cloudflare preview revision contract are aligned.");
