import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const moduleSource = read("app/suc-khoe-tre/symptom-episode-tracking.tsx");
const framework = read("app/suc-khoe-tre/health-framework.tsx");
const page = read("app/suc-khoe-tre/page.tsx");
const domainCatalog = read("app/suc-khoe-tre/health-domain-catalog.ts");
const docs = read("docs/SYMPTOM_EPISODE_TRACKING_V1.md");

const required = [
  [moduleSource, 'SYMPTOM_EPISODE_DOMAIN_ID = "symptoms-illness-first-aid"', "canonical symptom domain"],
  [moduleSource, 'SYMPTOM_EPISODE_RECORD_KIND = "symptom-illness-episode-v1"', "episode record kind"],
  [moduleSource, 'SYMPTOM_EPISODE_UPDATE_KIND = "symptom-episode-update-v1"', "episode update kind"],
  [moduleSource, "useSensitiveVaultDomain(SYMPTOM_EPISODE_DOMAIN_ID)", "Profile Privacy + Vault access"],
  [moduleSource, "listVaultRecords(key, profileId)", "Vault-only read"],
  [moduleSource, "putVaultRecord(key, payload)", "Vault-only write"],
  [moduleSource, "deleteVaultRecord(key, profileId, record.recordId)", "Vault delete"],
  [moduleSource, "episodeRecordId", "episode/update relation"],
  [moduleSource, "sourceKind", "provenance source kind"],
  [moduleSource, "sourceNote", "provenance source note"],
  [moduleSource, "aria-pressed", "selected-state accessibility"],
  [moduleSource, "Không triage, không red-flag engine", "clinical safety copy"],
  [framework, 'import SymptomEpisodeTracking from "./symptom-episode-tracking";', "framework import"],
  [framework, "<SymptomEpisodeTracking />", "journal composition"],
  [framework, "HealthVaultBoundary", "shared active-profile Vault provider"],
  [page, 'import "./symptom-episode-tracking.css";', "page stylesheet"],
  [domainCatalog, 'id: "symptoms-illness-first-aid"', "domain catalog entry"],
  [docs, "không tự ghép", "legacy daily symptom migration guardrail"],
];

const failures = required.filter(([source, token]) => !source.includes(token)).map(([, , label]) => `Missing: ${label}`);

const forbiddenModulePatterns = [
  [/\bfetch\s*\(/, "network fetch"],
  [/axios\b/, "axios/network client"],
  [/localStorage\s*\./, "localStorage episode persistence"],
  [/sessionStorage\s*\./, "sessionStorage episode persistence"],
  [/HealthLocalState/, "baseline HealthLocalState episode storage"],
  [/DailyRecord/, "DailyRecord episode storage"],
  [/setState\s*\(/, "framework baseline state mutation inside episode module"],
  [/nextReminderOccurrence|occurrenceDueNow|ReminderManager/, "automatic reminder coupling"],
  [/diagnos(e|is)|riskScore|triageScore|redFlagScore|doseCalculation/i, "automatic clinical scoring/diagnosis code"],
];

for (const [pattern, label] of forbiddenModulePatterns) {
  if (pattern.test(moduleSource)) failures.push(`Forbidden: ${label}`);
}

if (!framework.includes('{activeProfileId ? <SymptomEpisodeTracking /> : null}')) {
  failures.push("SymptomEpisodeTracking must be gated by an active profile in Journal");
}

if (!framework.includes('<HealthVaultBoundary profileId={activeProfileId}>')) {
  failures.push("Health content must share one active-profile Vault boundary across navigation");
}

if (framework.includes('{activeProfileId ? <HealthVaultBoundary profileId={activeProfileId}>')) {
  failures.push("Nested profile-only SecureVaultSessionProvider must be removed after shared boundary migration");
}

if (failures.length) {
  console.error("Symptom Episode Tracking V1 validation FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Symptom Episode Tracking V1 validation PASS");
