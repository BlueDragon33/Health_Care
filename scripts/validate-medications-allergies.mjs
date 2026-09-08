import fs from "node:fs";

const moduleSource = fs.readFileSync("app/suc-khoe-tre/medications-allergies.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/medications-allergies.css", "utf8");
const access = fs.readFileSync("app/suc-khoe-tre/use-sensitive-vault-domain.ts", "utf8");
const domains = fs.readFileSync("app/suc-khoe-tre/health-domain-catalog.ts", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Medications & Allergies V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'MEDICATIONS_ALLERGIES_DOMAIN_ID = "medications-allergies"',
  'MEDICATION_RECORD_KIND = "medication-v1"',
  'ALLERGY_RECORD_KIND = "allergy-v1"',
  'useSensitiveVaultDomain(MEDICATIONS_ALLERGIES_DOMAIN_ID)',
  'visibility === "unconfigured"',
  'status !== "unlocked"',
  'status === "unlocked" && key',
  'await listVaultRecords(key, profileId)',
  'await putVaultRecord(key, payload)',
  'await deleteVaultRecord(key, profileId, record.recordId)',
  'await refreshRecordCount()',
  'crypto.randomUUID()',
  'window.confirm(',
  'sourceKind: SourceKind',
  'instructionsText: string',
  'reactionText: string',
  'noPlaintextReminderLeakage: true',
  'noDoseCalculation: true',
  'noMedicationRecommendation: true',
  'noInteractionEngine: true',
  'noAutomaticTreatmentChange: true',
  'noAllergyDiagnosis: true',
  'noAdminOrNetworkFlow: true',
]) need(moduleSource, token, "Vault/medical-safety contract");

for (const token of [
  'requiresExplicitProfilePrivacyPolicy: true',
  'respectsCurrentViewerRole: true',
  'requiresActiveProfileUnlockedVault: true',
  'sameTabPrivacyChangesPropagate: true',
  'noAdminOrNetworkDependency: true',
]) need(access, token, "shared access guardrail");

need(domains, 'id: "medications-allergies"', "existing health domain");
const domainStart = domains.indexOf('id: "medications-allergies"');
if (domainStart < 0) throw new Error("Không tìm thấy medications-allergies domain");
const domainSlice = domains.slice(domainStart, domainStart + 1100);
need(domainSlice, 'privacy: "highly-sensitive"', "domain must remain highly-sensitive");
need(domainSlice, "Ứng dụng không tự đề xuất liều hoặc thay đổi thuốc", "existing medication guardrail");

for (const forbidden of [
  "HealthLocalState",
  "DailyRecord",
  "currentDay(",
  "updateDay(",
  "exportHealthBackup",
  "HealthTimeline",
  "health-reminders",
  "ReminderManager",
  "/api/control",
  "CONTROL_SERVICE_SECRET",
]) {
  if (moduleSource.includes(forbidden)) throw new Error(`Medications & Allergies không được phụ thuộc plaintext/baseline/reminder/control flow: ${forbidden}`);
}

if (/(?:window\.)?localStorage\s*\./.test(moduleSource) || /(?:window\.)?sessionStorage\s*\./.test(moduleSource)) {
  throw new Error("Medications & Allergies không được dùng Web Storage API cho dữ liệu nhạy cảm");
}
if (/\bfetch\s*\(/.test(moduleSource) || /\bfetch\s*\(/.test(access)) throw new Error("Medications & Allergies không được gọi network/API trực tiếp");
if (/console\.(?:log|debug|info|warn|error)/.test(moduleSource)) throw new Error("Medications & Allergies không được log dữ liệu nhạy cảm");

for (const dangerousPattern of [
  /calculateDose/i,
  /doseRecommendation/i,
  /interactionCheck/i,
  /recommendedDose/i,
  /auto(?:matic)?Prescription/i,
]) {
  if (dangerousPattern.test(moduleSource)) throw new Error(`Phát hiện logic dược lâm sàng ngoài phạm vi V1: ${dangerousPattern}`);
}

for (const token of [
  '"prescription"',
  '"clinician"',
  '"caregiver"',
  '"known-record"',
  'Hướng dẫn dùng — chép nguyên thông tin đã được cung cấp',
  'Không nhờ ứng dụng tự tính hoặc suy ra liều.',
  'Không tự phân loại mức độ',
  'Đây là sổ ghi chép thông tin đã biết.',
]) need(moduleSource, token, "provenance/safety UX");

for (const token of [
  'import MedicationsAllergies from "./medications-allergies"',
  '<HealthVaultBoundary profileId={activeProfileId}>',
  '<SecureVaultBackupCenter />',
  '<MedicationsAllergies />',
  '<PrivateSensitiveNotes />',
]) need(framework, token, "runtime integration");

const backupIndex = framework.indexOf("<SecureVaultBackupCenter />");
const medsIndex = framework.indexOf("<MedicationsAllergies />");
const notesIndex = framework.indexOf("<PrivateSensitiveNotes />");
if (!(backupIndex >= 0 && backupIndex < medsIndex && medsIndex < notesIndex)) throw new Error("Medications & Allergies phải nằm trong cùng Vault provider sau Backup Center và trước Private Notes");

need(page, 'import "./medications-allergies.css"', "stylesheet integration");
need(packageJson, "validate-medications-allergies.mjs", "CI gate");

for (const token of [
  "box-shadow: inset",
  ":focus-visible",
  "aria-pressed={mode === \"medication\"}",
  "aria-pressed={mode === \"allergy\"}",
]) need(moduleSource + styles, token, "3D/selected/accessibility contract");
for (const token of ["@media (max-width: 620px)", "@media (prefers-reduced-motion: reduce)"]) need(styles, token, "responsive/reduced-motion contract");

console.log("Medications & Allergies V1 PASS: highly-sensitive Profile Privacy + viewer + unlocked Vault gating, provenance fields, encrypted-only persistence/backup compatibility, destructive confirmation and no dose/recommendation/interaction/Admin/reminder leakage are enforced.");
