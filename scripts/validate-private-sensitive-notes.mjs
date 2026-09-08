import fs from "node:fs";

const notes = fs.readFileSync("app/suc-khoe-tre/private-sensitive-notes.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/private-sensitive-notes.css", "utf8");
const privacy = fs.readFileSync("app/suc-khoe-tre/health-profile-privacy.ts", "utf8");
const domains = fs.readFileSync("app/suc-khoe-tre/health-domain-catalog.ts", "utf8");
const session = fs.readFileSync("app/suc-khoe-tre/secure-vault-session.tsx", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Private Sensitive Notes V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'PRIVATE_SENSITIVE_NOTES_DOMAIN_ID = "records-appointments-documents"',
  'PRIVATE_NOTE_KIND = "private-note-v1"',
  'useSecureVaultSession()',
  'loadProfilePrivacyPolicy(profileId)',
  'loadViewerRole()',
  'canViewerAccessDomain(policy, PRIVATE_SENSITIVE_NOTES_DOMAIN_ID, role)',
  'visibility === "unconfigured"',
  'status !== "unlocked"',
  'status === "unlocked" && key',
  'await putVaultRecord(key, payload)',
  'await listVaultRecords(key, profileId)',
  'records.filter(isPrivateNote)',
  'await deleteVaultRecord(key, profileId, note.recordId)',
  'await refreshRecordCount()',
  'crypto.randomUUID()',
  'noPlaintextFallback: true',
  'excludedFromBaselineTimelineAndBackup: true',
  'noAdminOrNetworkFlow: true',
  'noDiagnosisOrClinicalScoring: true',
]) need(notes, token, "privacy/vault binding");

for (const forbidden of [
  "localStorage",
  "sessionStorage",
  "HealthLocalState",
  "currentDay(",
  "updateDay(",
  "exportHealthBackup",
  "HealthTimeline",
  "/api/control",
  "CONTROL_SERVICE_SECRET",
]) {
  if (notes.includes(forbidden)) throw new Error(`Private Notes không được có plaintext/baseline/control fallback: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(notes)) throw new Error("Private Notes không được gọi network/API trực tiếp");
if (/console\.(?:log|debug|info|warn|error)/.test(notes)) throw new Error("Private Notes không được log nội dung nhạy cảm");

need(domains, 'id: "records-appointments-documents"', "existing domain");
const domainStart = domains.indexOf('id: "records-appointments-documents"');
const domainSlice = domains.slice(domainStart, domainStart + 900);
need(domainSlice, 'privacy: "highly-sensitive"', "domain must remain highly-sensitive");

for (const token of [
  'PROFILE_PRIVACY_CHANGED_EVENT = "suc-khoe-y-te:profile-privacy-changed"',
  'announcePrivacyChange("policy", policy.profileId)',
  'announcePrivacyChange("role")',
]) need(privacy, token, "same-tab privacy propagation");

for (const token of [
  'oneUnlockedKeyPerActiveProfileProvider: true',
  'profileSwitchDropsPreviousKeyReference: true',
  'pagehideLocksVault: true',
  'noPersistentSessionKey: true',
]) need(session, token, "shared vault session guardrail");

for (const token of [
  'import PrivateSensitiveNotes from "./private-sensitive-notes"',
  '<SecureVaultSessionProvider key={`vault-session-${activeProfileId}`} profileId={activeProfileId}>',
  '<PrivacyCenter profileId={activeProfileId} />',
  '<SecureVaultCenter />',
  '<PrivateSensitiveNotes />',
]) need(framework, token, "runtime composition");

need(page, 'import "./private-sensitive-notes.css"', "stylesheet integration");
need(packageJson, "validate-private-sensitive-notes.mjs", "CI gate");

for (const token of [
  "box-shadow: inset",
  ":focus-visible",
  "@media (max-width: 620px)",
  "@media (prefers-reduced-motion: reduce)",
]) need(styles, token, "3D/accessibility style");

console.log("Private Sensitive Notes V1 PASS: configured Profile Privacy + viewer permission + active-profile unlocked Vault are all required; plaintext baseline/network/Admin fallbacks are absent.");
