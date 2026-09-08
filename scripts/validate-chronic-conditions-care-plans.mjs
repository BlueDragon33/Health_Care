import fs from "node:fs";

const moduleText = fs.readFileSync("app/suc-khoe-tre/chronic-conditions-care-plans.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/chronic-conditions-care-plans.css", "utf8");
const domains = fs.readFileSync("app/suc-khoe-tre/health-domain-catalog.ts", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Chronic Conditions & Care Plans V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'CHRONIC_CONDITIONS_DOMAIN_ID = "chronic-conditions-care-plans"',
  'CONDITION_RECORD_KIND = "chronic-condition-v1"',
  'HISTORY_EVENT_RECORD_KIND = "medical-history-event-v1"',
  'CARE_PLAN_RECORD_KIND = "care-plan-v1"',
  'useSensitiveVaultDomain(CHRONIC_CONDITIONS_DOMAIN_ID)',
  'await listVaultRecords(key, profileId)',
  'await putVaultRecord(key, payload)',
  'await deleteVaultRecord(key, profileId, record.recordId)',
  'sourceKind:',
  'sourceNote:',
  'noGeneratedDiagnosis: true',
  'noGeneratedTreatmentPlan: true',
  'noGeneratedEmergencyInstructions: true',
  'vaultOnlyPersistence: true',
  'noBaselineTimelineOrAdminFlow: true',
]) need(moduleText, token, "privacy/vault/clinical guardrail");

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
  "diagnose(",
  "recommendTreatment",
  "generateTreatment",
  "calculateDose",
  "emergencyScore",
  "riskScore",
]) {
  if (moduleText.includes(forbiddenClinical)) throw new Error(`Không được tự sinh chẩn đoán/điều trị/risk score: ${forbiddenClinical}`);
}

need(domains, 'id: "chronic-conditions-care-plans"', "domain catalog");
const start = domains.indexOf('id: "chronic-conditions-care-plans"');
need(domains.slice(start, start + 1000), 'privacy: "highly-sensitive"', "domain highly-sensitive");

for (const token of [
  'import ChronicConditionsCarePlans from "./chronic-conditions-care-plans"',
  '<ChronicConditionsCarePlans />',
]) need(framework, token, "runtime integration");
need(page, 'import "./chronic-conditions-care-plans.css"', "stylesheet integration");
need(packageJson, "validate-chronic-conditions-care-plans.mjs", "CI gate");

for (const token of [
  "box-shadow:0 5px 0",
  "box-shadow:0 2px 0",
  ":focus-visible",
  "@media(max-width:760px)",
  "@media(prefers-reduced-motion:reduce)",
]) need(styles, token, "3D/accessibility style");

console.log("Chronic Conditions & Care Plans V1 PASS: highly-sensitive Vault-only persistence, provenance, no generated diagnosis/treatment, no baseline/Admin leakage.");
