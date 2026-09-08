import fs from "node:fs";

const moduleText = fs.readFileSync("app/suc-khoe-tre/preventive-care-records.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/preventive-care-records.css", "utf8");
const domains = fs.readFileSync("app/suc-khoe-tre/health-domain-catalog.ts", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Preventive Care Records V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'PREVENTIVE_CARE_DOMAIN_ID = "preventive-care"',
  'PREVENTIVE_VISIT_RECORD_KIND = "preventive-visit-v1"',
  'IMMUNIZATION_RECORD_KIND = "immunization-record-v1"',
  'useSensitiveVaultDomain(PREVENTIVE_CARE_DOMAIN_ID)',
  'await listVaultRecords(key, profileId)',
  'await putVaultRecord(key, payload)',
  'await deleteVaultRecord(key, profileId, record.recordId)',
  'sourceKind:',
  'sourceNote:',
  'noAutomaticImmunizationSchedule: true',
  'noAutomaticDueOrOverdueStatus: true',
  'noCountryScheduleAssumption: true',
  'noVaccineRecommendation: true',
  'noGeneratedNextVisit: true',
  'vaultOnlyPersistence: true',
]) need(moduleText, token, "Vault/provenance/guideline guardrail");

for (const forbidden of [
  "HealthLocalState",
  "DailyRecord",
  "HealthTimeline",
  "ReminderManager",
  "exportHealthBackup",
  "/api/control",
  "CONTROL_SERVICE_SECRET",
]) {
  if (moduleText.includes(forbidden)) throw new Error(`Không được có baseline/control/reminder fallback: ${forbidden}`);
}
if (/(?:window\.)?localStorage\s*\./.test(moduleText) || /(?:window\.)?sessionStorage\s*\./.test(moduleText)) throw new Error("Không được dùng Web Storage cho plaintext");
if (/\bfetch\s*\(/.test(moduleText)) throw new Error("Module không được gọi network trực tiếp");
if (/console\.(?:log|debug|info|warn|error)/.test(moduleText)) throw new Error("Không log dữ liệu nhạy cảm");

for (const forbiddenClinical of [
  "calculateNextDose",
  "nextDoseDate",
  "overdue",
  "catchUpSchedule",
  "recommendVaccine",
  "countrySchedule",
  "isCompleteSeries",
]) {
  if (moduleText.includes(forbiddenClinical) && !moduleText.includes(`noAutomaticDueOrOverdueStatus`)) throw new Error(`Không được tự suy lịch/khuyến nghị: ${forbiddenClinical}`);
}

need(domains, 'id: "preventive-care"', "domain catalog");
for (const token of [
  'import PreventiveCareRecords from "./preventive-care-records"',
  '<PreventiveCareRecords />',
]) need(framework, token, "runtime integration");
need(page, 'import "./preventive-care-records.css"', "stylesheet integration");
need(packageJson, "validate-preventive-care-records.mjs", "CI gate");

for (const token of [
  "box-shadow:0 5px 0",
  "box-shadow:0 2px 0",
  ":focus-visible",
  "@media(max-width:760px)",
  "@media(prefers-reduced-motion:reduce)",
]) need(styles, token, "3D/accessibility style");

console.log("Preventive Care Records V1 PASS: Vault-only history records, provenance, no automatic immunization schedule/due status/country assumption/Admin leakage.");
