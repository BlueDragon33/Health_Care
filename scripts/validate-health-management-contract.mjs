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
const commandRoute = read("app/api/control/device-commands/route.ts");
const launchService = read("app/control-web-launch.server.ts");
const deviceRoute = read("app/api/device/route.ts");
const deviceGate = read("app/suc-khoe-tre/device-gate.tsx");
const automationMigration = read("drizzle/0006_device_automation.sql");
const autoBlockMigration = read("drizzle/0008_device_auto_block.sql");
const commandMigration = read("drizzle/0009_control_command_ledger.sql");
const launchMigration = read("drizzle/0007_control_web_launch.sql");
const workerAutomation = read("worker/device-automation.ts");
const workerIndex = read("worker/index.ts");
const wrangler = read("wrangler.d1.jsonc");

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
  '"device-idempotent-commands"',
  '"device-auto-approval"',
  '"device-auto-block-pending"',
  '"control-web-launch"',
  'webLaunchTarget: "/suc-khoe-tre"',
  'healthDataInControlPlane: false',
  'profileDataInControlPlane: false',
  'independentRuntime: true',
  'adminRuntimeEmbedded: false',
]) {
  if (!contract.includes(required)) fail(`thiếu contract field: ${required}`);
}

for (const endpoint of ["/api/control/status", "/api/control/devices", "/api/control/device-commands", "/api/control/sessions", "/api/control/policy", "/api/control/automation", "/api/control/health-content", "/api/control/audit"]) {
  if (!contract.includes(`\"${endpoint}\"`)) fail(`thiếu endpoint ${endpoint}`);
}

if (!/HEALTH_MANAGEMENT_CONTRACT/.test(route) || !/siteOrigin/.test(route)) fail("contract route phải trả contract + origin runtime");
if (/requireControlService/.test(route)) fail("contract metadata phải đọc được trước handshake, không chứa dữ liệu sức khỏe");
if (/CONTROL_SERVICE_SECRET/.test(contract) && !/HEALTH_CONTROL_SERVICE_SECRET/.test(contract)) fail("không được fallback secret chung");
if (!/TOKEN_ISSUER = "application-management"/.test(auth) || !/TOKEN_AUDIENCE = "health-care-control"/.test(auth) || !/TOKEN_APP = "health-care"/.test(auth)) fail("identity trong auth không khớp contract");
if (!/HEALTH_CONTROL_SERVICE_SECRET/.test(auth)) fail("auth phải dùng secret app-scoped Health");

if (!/identity\.role !== "owner"/.test(automationRoute)) fail("chỉ owner được đổi quy tắc automation");
if (!/updateHealthDeviceAutomationSettings/.test(automationRoute)) fail("automation route phải ghi vào Health_Care");
if (!/autoApproveDevices/.test(automationService) || !/site_device_automation/.test(automationService)) fail("thiếu state duyệt tự động phía Health_Care");
if (!/autoBlockPendingDevices/.test(automationService) || !/pendingBlockAfterHours/.test(automationService)) fail("thiếu state tự động khóa pending phía Health_Care");
if (!/site_device_auto_approval_updated/.test(automationService)) fail("đổi duyệt tự động phải ghi audit Health");
if (!/site_device_auto_block_updated/.test(automationService)) fail("đổi auto-block phải ghi audit Health");
if (!/automation\.autoApproveDevices/.test(deviceRoute)) fail("đăng ký thiết bị phải áp dụng policy duyệt tự động");
if (!/site_device_automation/.test(automationMigration) || !/DEFAULT 0/.test(automationMigration)) fail("migration phải mặc định fail-closed: không tự duyệt");
if (!/auto_block_pending_devices/.test(autoBlockMigration) || !/DEFAULT 0/.test(autoBlockMigration)) fail("auto-block migration phải mặc định tắt");
if (!/pending_block_after_hours/.test(autoBlockMigration) || !/DEFAULT 168/.test(autoBlockMigration)) fail("auto-block mặc định phải chờ 7 ngày");

if (!/health_control_commands/.test(commandMigration) || !/command_id TEXT PRIMARY KEY/.test(commandMigration)) fail("thiếu durable command ledger theo commandId");
if (!/execution_nonce TEXT NOT NULL/.test(commandMigration) || !/state TEXT DEFAULT 'processing' NOT NULL/.test(commandMigration)) fail("command ledger phải khóa owner thực thi và trạng thái xử lý");
if (!/INSERT OR IGNORE INTO health_control_commands/.test(commandRoute)) fail("command endpoint phải claim commandId theo kiểu race-safe");
if (!/COMMAND_ID_CONFLICT/.test(commandRoute) || !/COMMAND_IN_PROGRESS/.test(commandRoute) || !/COMMAND_RECONCILIATION_REQUIRED/.test(commandRoute)) fail("command endpoint thiếu guard replay/conflict/reconciliation");
if (!/replayed: true/.test(commandRoute)) fail("command endpoint phải trả kết quả replay thay vì chạy lại lệnh completed");
if (!/current\.status !== expectedStatus/.test(commandRoute) || !/DEVICE_STATE_CONFLICT/.test(commandRoute)) fail("command endpoint phải dùng expectedStatus làm optimistic concurrency guard");
if (!/WHERE device_id = \? AND status = \?/.test(commandRoute) || !/DEVICE_STATE_RACE/.test(commandRoute)) fail("mutation thiết bị phải có compare-and-set tại thời điểm ghi");
if (!/revokeSiteSessionsForDevice/.test(commandRoute)) fail("lệnh block idempotent phải thu hồi session");
if (!/site_device_approved_command/.test(commandRoute) || !/site_device_blocked_command/.test(commandRoute)) fail("command thành công phải ghi audit theo commandId");
if (/DELETE FROM site_access_devices/.test(commandRoute)) fail("idempotent command Health không được xóa registry thiết bị");

if (!/status = 'pending'/.test(workerAutomation)) fail("auto-block chỉ được chọn thiết bị pending");
if (!/WHERE device_id = \? AND status = 'pending'/.test(workerAutomation)) fail("auto-block phải kiểm tra lại pending tại thời điểm ghi để tránh race");
if (!/status = 'blocked'/.test(workerAutomation) || !/blocked_at = CURRENT_TIMESTAMP/.test(workerAutomation)) fail("auto-block phải giữ registry và chuyển trạng thái blocked");
if (!/status = 'revoked'/.test(workerAutomation) || !/site_access_sessions/.test(workerAutomation)) fail("auto-block phải thu hồi session đang active");
if (!/site_device_auto_blocked/.test(workerAutomation) || !/course_audit_log/.test(workerAutomation)) fail("auto-block phải ghi audit theo từng thiết bị");
if (/DELETE FROM site_access_devices/.test(workerAutomation)) fail("auto-block không được xóa vĩnh viễn registry thiết bị");
if (!/MAX_DEVICES_PER_RUN = 50/.test(workerAutomation)) fail("scheduled sweep phải có batch bound");
if (!/runHealthDeviceAutomationSweep/.test(workerIndex) || !/async scheduled\(/.test(workerIndex)) fail("worker phải có scheduled handler riêng, không chạy automation trong fetch");
if (!/"crons": \["0 \* \* \* \*"\]/.test(wrangler)) fail("auto-block phải được kiểm tra hàng giờ");

if (!/verifyControlWebLaunchTicket/.test(auth) || !/purpose !== "web-launch"/.test(auth)) fail("auth phải tách vé web-launch khỏi vé control thông thường");
if (!/payload\.purpose === undefined \|\| payload\.purpose === "control"/.test(auth)) fail("control API không được chấp nhận vé web-launch");
if (!/health_control_web_launch/.test(launchService) || !/CONTROL_WEB_LAUNCH_REPLAY/.test(launchService)) fail("vé web-launch phải có ledger dùng một lần");
if (!/WHERE device_id = \? AND status = 'pending'/.test(launchService)) fail("web-launch chỉ được nâng thiết bị pending, không được tự mở khóa blocked");
if (!/current\.status === "blocked"/.test(launchService) || !/DEVICE_BLOCKED/.test(launchService)) fail("web-launch phải chặn thiết bị đã bị khóa");
if (!/health_control_web_launch/.test(launchMigration) || !/ticket_id.*PRIMARY KEY/.test(launchMigration)) fail("migration web-launch phải khóa ticket id duy nhất");
if (!/controlLaunchTicket/.test(deviceRoute) || !/site_device_control_web_launch_approved/.test(deviceRoute)) fail("đăng ký thiết bị phải xác minh và audit control launch");
if (!/promoteHealthControlWebLaunchDevice/.test(deviceRoute)) fail("đăng ký phải nâng cả thiết bị pending đã tồn tại khi mở từ control-plane");
if (!/device\.status !== "approved"/.test(deviceRoute)) fail("sau khi nâng pending phải đọc lại trạng thái approved trước khi trả client");
if (!/control-launch/.test(deviceGate) || !/clearControlLaunchTicket/.test(deviceGate)) fail("client phải đọc vé từ fragment rồi xóa khỏi thanh địa chỉ");
if (/controlLaunchTicket.*localStorage/s.test(deviceGate)) fail("không được lưu vé control launch vào localStorage");

console.log("Health management contract PASS: live contract v3 + idempotent device commands + auto approval + safe scheduled pending auto-block + one-time control web launch + pending promotion + blocked guard + privacy boundary OK.");
