import fs from "node:fs";

const registry = fs.readFileSync("app/suc-khoe-tre/health-profile-registry.ts", "utf8");
const contracts = fs.readFileSync("app/suc-khoe-tre/health-profile-contracts.ts", "utf8");
const switcher = fs.readFileSync("app/suc-khoe-tre/profile-switcher.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/profile-switcher.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Profile Registry V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'PROFILE_REGISTRY_KEY = "suc-khoe-y-te:profiles:v1"',
  'PROFILE_STATE_PREFIX = "suc-khoe-y-te:profile-state:v1:"',
  'PROFILE_MIGRATION_KEY = "suc-khoe-y-te:profiles:migration:v1"',
  "loadHealthState()",
  "legacyStorageKeyPreserved: true",
  "saveHealthProfileState(profileId",
  "loadHealthProfileState(profileId",
  "setActiveHealthProfile",
  "createHealthProfile",
  "deleteHealthProfile",
  "window.localStorage.removeItem(profileStateKey(profileId))",
]) need(registry, token, "registry/isolation contract");

if (registry.includes('window.localStorage.removeItem("suc-khoe-y-te:9-18:v2")')) throw new Error("Migration không được xóa storage legacy 9–18");

for (const token of [
  "noCrossProfileTimelineMixing: true",
  "noCrossProfileReminderMixing: true",
  "profileDeletionRequiresExplicitConfirmation: true",
  "exportIsProfileScopedByDefault: true",
  "deviceAccessDoesNotGrantAllProfileVisibility: true",
  "record bên trong HealthLocalState chưa được nhúng profileId riêng ở V1",
]) need(contracts, token, "documented boundary");

for (const token of [
  "Mỗi hồ sơ dùng storage key riêng",
  "aria-pressed={selected}",
  "window.confirm",
  "Hành động không ảnh hưởng hồ sơ khác",
]) need(switcher, token, "switch/delete safety UI");

for (const token of [
  'import ProfileSwitcher from "./profile-switcher"',
  "loadHealthProfileRegistry()",
  "loadHealthProfileState(activeId",
  "saveHealthProfileState(activeProfileId, state)",
  "function switchProfile(profileId: string)",
  "function createProfile(displayName: string)",
  "function removeProfile(profileId: string)",
  '<ProfileSwitcher registry={profileRegistry}',
  "profileId={activeProfileId}",
  "Xuất/khôi phục mặc định chỉ tác động hồ sơ đang chọn",
  "Đã khôi phục bản sao vào riêng hồ sơ đang chọn",
]) need(framework, token, "runtime integration");

if (/\bloadHealthState\(/.test(framework)) throw new Error("Framework không được đọc global single-profile state sau migration");
if (/\bsaveHealthState\(/.test(framework)) throw new Error("Framework không được ghi global single-profile state sau migration");
if (framework.includes("saveHealthProfileRegistry(synced);\n      setProfileRegistry(synced);")) throw new Error("Không được set Profile Registry đồng bộ bên trong persistence effect");
need(framework, "function updateProfile(patch: Partial<HealthProfile>)", "event-driven profile identity sync");
need(framework, "setProfileRegistry(syncRegistryIdentity(profileRegistry, activeProfileId, nextProfile))", "registry sync from edit event");

need(page, 'import "./profile-switcher.css"', "profile switcher stylesheet");
for (const token of ["box-shadow: inset", ":focus-visible", "@media (max-width: 620px)", "@media (prefers-reduced-motion: reduce)"]) need(styles, token, "3D/accessibility style");

console.log("Profile Registry V1 PASS: legacy-preserving migration, per-profile state keys, switch/create/delete isolation, profile-scoped backup and attention identity are wired.");
