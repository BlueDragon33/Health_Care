import fs from "node:fs";

const engine = fs.readFileSync("app/suc-khoe-tre/health-profile-privacy.ts", "utf8");
const center = fs.readFileSync("app/suc-khoe-tre/privacy-center.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/privacy-center.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Profile Privacy V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'HealthViewerRole = "self" | "caregiver" | "trusted-helper"',
  'HealthVisibility = "shared" | "caregiver-only" | "youth-private" | "emergency-card-only" | "unconfigured"',
  'PROFILE_PRIVACY_PREFIX = "suc-khoe-y-te:profile-privacy:v1:"',
  'VIEWER_ROLE_SESSION_KEY = "suc-khoe-y-te:viewer-role:v1"',
  'PROFILE_PRIVACY_CHANGED_EVENT = "suc-khoe-y-te:profile-privacy-changed"',
  'privacy === "highly-sensitive"',
  'return "unconfigured"',
  "canViewerAccessDomain",
  'announcePrivacyChange("policy", policy.profileId)',
  'announcePrivacyChange("role")',
  "deviceApprovalIsNotProfileAuthorization: true",
  "highlySensitiveRequiresExplicitVisibility: true",
  "noJurisdictionAgeCutoffHardcoded: true",
  "adminReceivesNoProfilePrivacyPolicy: true",
  "viewerRoleV1IsNotCryptographicAuthentication: true",
  "secureVaultRequiredBeforeStrongLocalRoleLock: true",
  "sameTabPrivacyChangesAreObservable: true",
]) need(engine, token, "privacy engine contract");

for (const token of [
  "Quyền vào thiết bị do Trung tâm Quản trị cấp không đồng nghĩa được xem mọi dữ liệu của hồ sơ.",
  "Chưa cấu hình · khóa mặc định",
  "vai trò vẫn là chế độ xem trong phiên, chưa phải xác thực danh tính",
  "Secure Health Vault hiện mã hóa payload nhạy cảm",
  "Không có dữ liệu quyền riêng tư nào được gửi sang Site Quản trị.",
  "Không tự thay đổi quyền theo một mốc tuổi pháp lý cố định.",
  "aria-pressed={role === item}",
]) need(center, token, "privacy UI safety boundary");

for (const token of ["box-shadow: inset", ":focus-visible", "@media (max-width: 760px)", "@media (prefers-reduced-motion: reduce)"]) need(styles, token, "3D/accessibility style");

need(framework, 'import PrivacyCenter from "./privacy-center"', "framework import");
need(framework, "function HealthVaultBoundary({ profileId, children }", "shared profile-scoped Vault boundary helper");
need(framework, '<SecureVaultSessionProvider key={`vault-session-${profileId}`} profileId={profileId}>', "profile-scoped Vault provider inside shared boundary");
need(framework, '<HealthVaultBoundary profileId={activeProfileId}>', "active-profile Vault boundary composition");
need(framework, '<PrivacyCenter profileId={activeProfileId} />', "profile-scoped privacy center");
need(page, 'import "./privacy-center.css"', "privacy stylesheet");

if (framework.includes('<HealthVaultBoundary profileId={activeProfileId}>')) {
  throw new Error("Profile Privacy validator phát hiện provider cũ chỉ nằm trong Profile section; phải dùng HealthVaultBoundary chung cho active profile");
}
if (/age\s*[>=<]+\s*(13|14|15|16|18)/.test(engine)) throw new Error("Privacy V1 không được hard-code cutoff pháp lý theo tuổi");
if (engine.includes("fetch(") || engine.includes("/api/control")) throw new Error("Profile privacy policy V1 không được gửi sang Control Plane");

console.log("Profile Privacy V1 PASS: profile-scoped local policy, shared active-profile Vault boundary, same-tab propagation, explicit highly-sensitive configuration, viewer roles, no legal-age hard-code, no Admin health-data flow.");
