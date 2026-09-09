import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const fail = (message) => { throw new Error(`Health management contract failed: ${message}`); };

const contract = read("app/health-management-contract.ts");
const route = read("app/api/control/contract/route.ts");
const auth = read("app/control-auth.server.ts");

for (const required of [
  'application: "health-care"',
  'canonicalApplication: "health-care"',
  'controlProtocol: "application-management-health-control-v1"',
  'issuer: "application-management"',
  'audience: "health-care-control"',
  'app: "health-care"',
  'secretEnv: "HEALTH_CONTROL_SERVICE_SECRET"',
  'namespace: "SK-"',
  'healthDataInControlPlane: false',
  'profileDataInControlPlane: false',
  'independentRuntime: true',
  'adminRuntimeEmbedded: false',
]) {
  if (!contract.includes(required)) fail(`thiếu contract field: ${required}`);
}

for (const endpoint of ["/api/control/status", "/api/control/devices", "/api/control/sessions", "/api/control/policy", "/api/control/health-content", "/api/control/audit"]) {
  if (!contract.includes(`\"${endpoint}\"`)) fail(`thiếu endpoint ${endpoint}`);
}

if (!/HEALTH_MANAGEMENT_CONTRACT/.test(route) || !/siteOrigin/.test(route)) fail("contract route phải trả contract + origin runtime");
if (/requireControlService/.test(route)) fail("contract metadata phải đọc được trước handshake, không chứa dữ liệu sức khỏe");
if (/CONTROL_SERVICE_SECRET/.test(contract) && !/HEALTH_CONTROL_SERVICE_SECRET/.test(contract)) fail("không được fallback secret chung");
if (!/TOKEN_ISSUER = "application-management"/.test(auth) || !/TOKEN_AUDIENCE = "health-care-control"/.test(auth) || !/TOKEN_APP = "health-care"/.test(auth)) fail("identity trong auth không khớp contract");
if (!/HEALTH_CONTROL_SERVICE_SECRET/.test(auth)) fail("auth phải dùng secret app-scoped Health");

console.log("Health management contract PASS: public metadata + signed control identity + privacy boundary OK.");
