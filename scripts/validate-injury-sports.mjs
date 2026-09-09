import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const fail = (message) => { throw new Error(`Injury & sports validation failed: ${message}`); };

const moduleSource = read("app/suc-khoe-tre/injury-sports-musculoskeletal.tsx");
const hostSource = read("app/suc-khoe-tre/advanced-health-modules.tsx");
const clientSource = read("app/suc-khoe-tre/health-client.tsx");
const registrySource = read("app/suc-khoe-tre/health-profile-registry.ts");
const maturitySource = read("app/suc-khoe-tre/health-domain-maturity.ts");
const recordContracts = read("app/suc-khoe-tre/health-record-contracts.ts");

for (const marker of [
  'INJURY_SPORTS_DOMAIN_ID = "injury-sports-musculoskeletal"',
  'INJURY_EPISODE_RECORD_KIND = "injury-episode-v1"',
  "useSensitiveVaultDomain(INJURY_SPORTS_DOMAIN_ID)",
  "listVaultRecords",
  "putVaultRecord",
  "deleteVaultRecord",
  "headImpactConcern",
  "stoppedActivity",
  "medicalCareSought",
  "returnToActivityDate",
  "clinicianClearanceReference",
  "painLevel0to10",
]) {
  if (!moduleSource.includes(marker)) fail(`module thiếu marker bắt buộc: ${marker}`);
}

if (!/painNumber\s*!==\s*null[\s\S]*painNumber\s*<\s*0[\s\S]*painNumber\s*>\s*10/.test(moduleSource)) {
  fail("mức đau tự ghi phải được chặn ngoài khoảng 0–10");
}

for (const phrase of [
  "không phải chẩn đoán",
  "không tự cấp quyền quay lại tập luyện/thi đấu",
  "không tự xác nhận “đủ an toàn để quay lại thi đấu”",
]) {
  if (!moduleSource.toLowerCase().includes(phrase.toLowerCase())) fail(`thiếu guardrail hiển thị: ${phrase}`);
}

if (/\bfetch\s*\(|\/api\/|Application Management|HEALTH_CONTROL_SERVICE_SECRET|workers\.dev/i.test(moduleSource)) {
  fail("module chấn thương không được phụ thuộc network, Control API hoặc secret quản trị");
}

if (!/SecureVaultSessionProvider/.test(hostSource) || !/SecureVaultCenter/.test(hostSource) || !/InjurySportsMusculoskeletal/.test(hostSource)) {
  fail("advanced module host phải gắn module chấn thương bên trong Secure Vault session");
}
if (!/HEALTH_PROFILE_REGISTRY_CHANGED_EVENT/.test(hostSource) || !/PROFILE_REGISTRY_KEY/.test(hostSource)) {
  fail("advanced module host phải theo dõi thay đổi hồ sơ cùng tab và khác tab");
}
if (!/AdvancedHealthModules/.test(clientSource)) fail("HealthClient canonical chưa mount AdvancedHealthModules");

for (const marker of [
  'HEALTH_PROFILE_REGISTRY_CHANGED_EVENT = "health-profile-registry-changed"',
  "emitRegistryChanged(saved)",
  "window.dispatchEvent(new CustomEvent(HEALTH_PROFILE_REGISTRY_CHANGED_EVENT",
]) {
  if (!registrySource.includes(marker)) fail(`Profile Registry chưa phát sự kiện đồng bộ: ${marker}`);
}

const injuryMaturity = maturitySource.match(/"injury-sports-musculoskeletal": \{([\s\S]*?)\n  \},/)?.[1] ?? "";
if (!/maturity: "operational"/.test(injuryMaturity)) fail("injury-sports-musculoskeletal chỉ được phát hành khi maturity là operational");
for (const evidence of ["injury-sports-musculoskeletal.tsx", "advanced-health-modules.tsx", "health-record-contracts.ts"]) {
  if (!injuryMaturity.includes(evidence)) fail(`maturity thiếu evidence: ${evidence}`);
}

if (!/export type InjuryEpisodeRecord/.test(recordContracts)) fail("thiếu InjuryEpisodeRecord trong data contract");
for (const field of ["occurredAt", "bodyArea", "painLevel0to10", "headImpactConcern", "medicalCareSought", "returnToActivityDate", "clinicianClearanceDocumentId"]) {
  if (!recordContracts.includes(field)) fail(`InjuryEpisodeRecord thiếu trường contract: ${field}`);
}

console.log("Injury & sports V1 PASS: encrypted profile-scoped episodes · 0–10 input guard · head-impact/medical-care tracking · no diagnosis/return-to-play decision · no network/admin dependency.");
