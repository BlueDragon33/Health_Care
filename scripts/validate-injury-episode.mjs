import fs from "node:fs";

const moduleText = fs.readFileSync("app/suc-khoe-tre/injury-sports-musculoskeletal.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/injury-sports-musculoskeletal.css", "utf8");
const domains = fs.readFileSync("app/suc-khoe-tre/health-domain-catalog.ts", "utf8");
const maturity = fs.readFileSync("app/suc-khoe-tre/health-domain-maturity.ts", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Injury Episode V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'INJURY_SPORTS_DOMAIN_ID = "injury-sports-musculoskeletal"',
  'INJURY_EPISODE_RECORD_KIND = "injury-episode-v1"',
  'useSensitiveVaultDomain(INJURY_SPORTS_DOMAIN_ID)',
  'await listVaultRecords(key, profileId)',
  'await putVaultRecord(key, payload)',
  'await deleteVaultRecord(key, profileId, record.recordId)',
  'episodeStatus:',
  'followUpDate:',
  'sourceKind:',
  'sourceNote:',
  'headImpactConcern:',
  'clinicianClearanceRecorded:',
  'noGeneratedDiagnosis: true',
  'noRiskScore: true',
  'noAutomatedReturnToPlay: true',
  'vaultOnlyPersistence: true',
  'noAdminOrNetworkDependency: true',
]) need(moduleText, token, "episode/vault/clinical guardrail");

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
if (/(?:window\.)?localStorage\s*\./.test(moduleText) || /(?:window\.)?sessionStorage\s*\./.test(moduleText)) throw new Error("Không được dùng Web Storage cho plaintext episode");
if (/\bfetch\s*\(/.test(moduleText)) throw new Error("Module không được gọi network trực tiếp");
if (/console\.(?:log|debug|info|warn|error)/.test(moduleText)) throw new Error("Không log dữ liệu chấn thương");

for (const forbiddenClinical of [
  "diagnose(",
  "recommendTreatment",
  "generateTreatment",
  "calculateDose",
  "emergencyScore",
  "riskScore(",
  "clearForSports(",
]) {
  if (moduleText.includes(forbiddenClinical)) throw new Error(`Không được tự sinh chẩn đoán/điều trị/clearance/risk score: ${forbiddenClinical}`);
}

for (const evidenceToken of [
  "https://www.cdc.gov/heads-up/response/index.html",
  "https://www.cdc.gov/heads-up/signs-symptoms/index.html",
  "https://www.nhs.uk/conditions/sprains-and-strains/",
  "Không quay lại thi đấu trong ngày",
  "không tự quyết định đủ điều kiện quay lại thể thao",
]) need(moduleText, evidenceToken, "evidence-backed safety boundary");

need(domains, 'id: "injury-sports-musculoskeletal"', "domain catalog");
const domainStart = domains.indexOf('id: "injury-sports-musculoskeletal"');
need(domains.slice(domainStart, domainStart + 1200), 'privacy: "sensitive"', "sensitive privacy level");
need(domains.slice(domainStart, domainStart + 1200), "Không tự cấp giấy đủ điều kiện thể thao", "return-to-play guardrail");

const maturityStart = maturity.indexOf('"injury-sports-musculoskeletal"');
const maturitySlice = maturity.slice(maturityStart, maturityStart + 800);
need(maturitySlice, 'maturity: "operational"', "runtime maturity truth");
need(maturitySlice, '"injury-sports-musculoskeletal.tsx"', "maturity evidence");

for (const token of [
  'import InjurySportsMusculoskeletal from "./injury-sports-musculoskeletal"',
  '<InjurySportsMusculoskeletal />',
]) need(framework, token, "runtime integration");
need(page, 'import "./injury-sports-musculoskeletal.css"', "stylesheet integration");
need(packageJson, "validate-injury-episode.mjs", "CI gate");

for (const token of [
  "box-shadow:0 5px 0",
  "box-shadow:0 2px 0",
  ":focus-visible",
  "@media(max-width:760px)",
  "@media(prefers-reduced-motion:reduce)",
]) need(styles, token, "3D/accessibility style");

console.log("Injury Episode V1 PASS: encrypted episode lifecycle + provenance + evidence-backed head/limb safety + no diagnosis/risk-score/automated return-to-play.");
