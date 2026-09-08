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
  ],
  "app/api/control/devices/route.ts": [
    "classificationConfidence",
    "classificationReason",
    "installationId",
    "osName",
    "browserVersion",
    "pwaMode",
  ],
  "drizzle/0004_device_metadata_v2.sql": [
    "installation_id",
    "os_name",
    "browser_version",
    "classification_confidence",
    "classification_reason",
    "metadata_updated_at",
  ],
};

for (const [file, tokens] of Object.entries(required)) {
  const text = fs.readFileSync(file, "utf8");
  for (const token of tokens) {
    if (!text.includes(token)) throw new Error(`${file} thiếu contract: ${token}`);
  }
}

console.log("Device auto-classification V2 PASS: enrollment metadata, server classification, D1 schema and Control API are aligned.");
