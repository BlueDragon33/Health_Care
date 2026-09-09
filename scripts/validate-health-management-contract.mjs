import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const fail = (message) => { throw new Error(`Health management contract failed: ${message}`); };

const contract = read("app/health-management-contract.ts");
const route = read("app/api/control/contract/route.ts");
const auth = read("app/control-auth.server.ts");
const automationRoute = read("app/api/control/automation/route.ts");
const automationService = read("app/device-automation.server.ts");
const launchService = read("app/control-web-launch.server.ts");
const deviceRoute = read("app/api/device/route.ts");
const deviceGate = read("app/suc-khoe-tre/device-gate.tsx");
const automationMigration = read("drizzle/0006_device_automation.sql");
const launchMigration = read("drizzle/0007_control_web_launch.sql");

for (const required of [
  'application: "health-care"',
  'canonicalApplication: "health-care"',
  'contractVersion: 3',
  'controlProtocol: "application-management-health-control-v1"',
  'issuer: "application-management"',
  'audience: "health-care-control"',
  'app: "health-care"',
  'webLaunchTtlSeconds: 60',
  'secretEnv: "HEALTH_CONTROL_SERVICE_SECRET"',
  'namespace: "SK-"',
  '"device-auto-approval"',
  '"control-web-launch"',
  'webLaunchTarget: "/suc-khoe-tre"',
  'healthDataInControlPlane: false',
  'profileDataInControlPlane: false',
  'independentRuntime: true',
  'adminRuntimeEmbedded: false',
]) {
  if (!contract.includes(required)) fail(`thiếu contract field: ${required}`);
}

for (const endpoint of ["/api/control/status", "/api/control/devices", "/api/control/sessions", "/api/control/policy", "/api/control/automation", "/api/control/health-content", "/api/control/audit"]) {
  if (!contract.includes(`\"${endpoint}\"`)) fail(`thiếu endpoint ${endpoint}`);
}

if (!/HEALTH_MANAGEMENT_CONTRACT/.test(route) || !/siteOrigin/.test(route)) fail("contract route phải trả contract + origin runtime");
if (/requireControlService/.test(route)) fail("contract metadata phải đọc được trước handshake, không chứa dữ liệu sức khỏe");
if (/CONTROL_SERVICE_SECRET/.test(contract) && !/HEALTH_CONTROL_SERVICE_SECRET/.test(contract)) fail("không được fallback secret chung");
if (!/TOKEN_ISSUER = "application-management"/.test(auth) || !/TOKEN_AUDIENCE = "health-care-control"/.test(auth) || !/TOKEN_APP = "health-care"/.test(auth)) fail("identity trong auth không khớp contract");
if (!/HEALTH_CONTROL_SERVICE_SECRET/.test(auth)) fail("auth phải dùng secret app-scoped Health");

if (!/identity\.role !== "owner"/.test(automationRoute)) fail("chỉ owner được đổi duyệt tự động");
if (!/updateHealthDeviceAutomationSettings/.test(automationRoute)) fail("automation route phải ghi vào Health_Care");
if (!/autoApproveDevices/.test(automationService) || !/site_device_automation/.test(automationService)) fail("thiếu state duyệt tự động phía Health_Care");
if (!/site_device_auto_approval_updated/.test(automationService)) fail("đổi duyệt tự động phải ghi audit Health");
if (!/automation\.autoApproveDevices/.test(deviceRoute)) fail("đăng ký thiết bị phải áp dụng policy duyệt tự động");
if (!/site_device_automation/.test(automationMigration) || !/DEFAULT 0/.test(automationMigration)) fail("migration phải mặc định fail-closed: không tự duyệt");

if (!/verifyControlWebLaunchTicket/.test(auth) || !/purpose !== "web-launch"/.test(auth)) fail("auth phải tách vé web-launch khỏi vé control thông thường");
if (!/payload\.purpose === undefined \|\| payload\.purpose === "control"/.test(auth)) fail("control API không được chấp nhận vé web-launch");
if (!/health_control_web_launch/.test(launchService) || !/CONTROL_WEB_LAUNCH_REPLAY/.test(launchService)) fail("vé web-launch phải có ledger dùng một lần");
if (!/health_control_web_launch/.test(launchMigration) || !/ticket_id.*PRIMARY KEY/.test(launchMigration)) fail("migration web-launch phải khóa ticket id duy nhất");
if (!/controlLaunchTicket/.test(deviceRoute) || !/site_device_control_web_launch_approved/.test(deviceRoute)) fail("đăng ký thiết bị phải xác minh và audit control launch");
if (!/control-launch/.test(deviceGate) || !/clearControlLaunchTicket/.test(deviceGate)) fail("client phải đọc vé từ fragment rồi xóa khỏi thanh địa chỉ");
if (/controlLaunchTicket.*localStorage/s.test(deviceGate)) fail("không được lưu vé control launch vào localStorage");

console.log("Health management contract PASS: live contract v3 + auto approval + one-time control web launch + privacy boundary OK.");
