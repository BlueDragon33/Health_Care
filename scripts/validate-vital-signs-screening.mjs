import fs from "node:fs";

const moduleText = fs.readFileSync("app/suc-khoe-tre/vital-signs-screening.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/vital-signs-screening.css", "utf8");
const domains = fs.readFileSync("app/suc-khoe-tre/health-domain-catalog.ts", "utf8");
const hook = fs.readFileSync("app/suc-khoe-tre/use-sensitive-vault-domain.ts", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Vital Signs & Screening V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'VITAL_SIGNS_SCREENING_DOMAIN_ID = "vital-signs-screening-results"',
  'VITAL_RECORD_KIND = "vital-sign-v1"',
  'SENSORY_SCREEN_RECORD_KIND = "sensory-screen-v1"',
  'SCREENING_RESULT_RECORD_KIND = "screening-result-v1"',
  'useSensitiveVaultDomain(VITAL_SIGNS_SCREENING_DOMAIN_ID)',
  'await listVaultRecords(key, profileId)',
  'await putVaultRecord(key, payload)',
  'await deleteVaultRecord(key, profileId, record.recordId)',
  'await refreshRecordCount()',
  'crypto.randomUUID()',
  'sourceKind:',
  'sourceNote:',
  'referenceText:',
  'noAutomaticRangeComparison: true',
  'noAutomaticNormalAbnormalClassification: true',
  'noDiagnosisOrTreatmentRecommendation: true',
  'excludedFromBaselineTimelineAndBackup: true',
]) need(moduleText, token, "privacy/Vault/clinical boundary");

for (const token of [
  '"blood-pressure": "Huyết áp"',
  '"heart-rate": "Nhịp tim"',
  'temperature: "Nhiệt độ cơ thể"',
  'spo2: "SpO₂"',
  '"respiratory-rate": "Nhịp thở"',
  'return "mmHg"',
  'return "bpm"',
  'return "°C"',
  'return "%"',
  'return "lần/phút"',
  'modality: "vision"',
  'testName:',
  'resultText:',
]) need(moduleText, token, "supported record model");

for (const token of [
  'aria-pressed={mode === "vitals"}',
  'aria-pressed={mode === "sensory"}',
  'aria-pressed={mode === "screening"}',
]) need(moduleText, token, "persistent selected state accessibility");

for (const forbidden of [
  "HealthLocalState",
  "DailyRecord",
  "currentDay(",
  "updateDay(",
  "HealthTimeline",
  "ReminderManager",
  "exportHealthBackup",
  "/api/control",
  "CONTROL_SERVICE_SECRET",
  "assessWhoBmiForAge",
  "calculateBmi",
  "zScore",
  "percentile",
]) {
  if (moduleText.includes(forbidden)) throw new Error(`Vital Signs không được dùng baseline/clinical engine/control path: ${forbidden}`);
}

if (/(?:window\.)?localStorage\s*\./.test(moduleText) || /(?:window\.)?sessionStorage\s*\./.test(moduleText)) {
  throw new Error("Vital Signs không được dùng Web Storage API cho plaintext");
}
if (/\bfetch\s*\(/.test(moduleText)) throw new Error("Vital Signs không được gọi network/API trực tiếp");
if (/console\.(?:log|debug|info|warn|error)/.test(moduleText)) throw new Error("Vital Signs không được log dữ liệu nhạy cảm");

need(domains, 'id: "vital-signs-screening-results"', "domain catalog");
const domainStart = domains.indexOf('id: "vital-signs-screening-results"');
const domainSlice = domains.slice(domainStart, domainStart + 1200);
need(domainSlice, 'privacy: "highly-sensitive"', "domain highly-sensitive");
need(domainSlice, 'Không tự suy diễn bất thường', "catalog clinical guardrail");

for (const token of [
  'requiresExplicitProfilePrivacyPolicy: true',
  'respectsCurrentViewerRole: true',
  'requiresActiveProfileUnlockedVault: true',
  'noAdminOrNetworkDependency: true',
]) need(hook, token, "shared sensitive-domain access guardrail");

for (const token of [
  'import VitalSignsScreening from "./vital-signs-screening"',
  '<VitalSignsScreening />',
]) need(framework, token, "runtime composition");
need(page, 'import "./vital-signs-screening.css"', "stylesheet integration");
need(packageJson, "validate-vital-signs-screening.mjs", "CI gate");

for (const token of [
  "box-shadow: inset",
  ":focus-visible",
  "@media (max-width: 760px)",
  "@media (prefers-reduced-motion: reduce)",
]) need(styles, token, "3D/accessibility style");

console.log("Vital Signs & Screening Results V1 PASS: highly-sensitive Profile Privacy + viewer role + unlocked Vault required; encrypted-only persistence and no automatic clinical interpretation/control-plane leakage verified.");
