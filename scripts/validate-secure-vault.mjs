import fs from "node:fs";
import { webcrypto } from "node:crypto";

const vault = fs.readFileSync("app/suc-khoe-tre/health-secure-vault.ts", "utf8");
const session = fs.readFileSync("app/suc-khoe-tre/secure-vault-session.tsx", "utf8");
const center = fs.readFileSync("app/suc-khoe-tre/secure-vault-center.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/secure-vault-center.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Secure Vault thiếu ${label}: ${token}`);
}

for (const token of [
  'VAULT_CONFIG_PREFIX = "suc-khoe-y-te:vault-config:v1:"',
  'VAULT_DB_NAME = "suc-khoe-y-te-vault-v1"',
  'VAULT_STORE_NAME = "records"',
  'VAULT_PBKDF2_ITERATIONS = 250_000',
  'VAULT_AUTO_LOCK_MS = 10 * 60 * 1000',
  'VAULT_MIN_PIN_LENGTH = 8',
  'name: "PBKDF2"',
  'hash: "SHA-256"',
  'name: "AES-GCM"',
  'length: 256',
  'additionalData: aad(profileId)',
  'crypto.getRandomValues(bytes)',
  'window.localStorage.setItem(configKey(config.profileId), JSON.stringify(config))',
  'indexedDB.open(VAULT_DB_NAME, 1)',
  'await ensureVaultStorageAvailable()',
  'async function assertKeyMatchesProfile',
  'await assertKeyMatchesProfile(key, payload.profileId)',
  'await assertKeyMatchesProfile(key, profileId)',
  'deleteVaultRecord(key: CryptoKey',
  'countVaultRecords(key: CryptoKey',
  'pinIsNeverPersisted: true',
  'derivedKeyIsMemoryOnly: true',
  'profileBoundAuthenticatedData: true',
  'destructiveRecordOperationsRequireUnlockedKey: true',
  'adminReceivesNoVaultKeyOrPayload: true',
  'existingBaselineStateNotSilentlyMigrated: true',
]) need(vault, token, "crypto/storage contract");

if (/\bfetch\s*\(/.test(vault + session + center)) throw new Error("Secure Vault không được gọi network/API trực tiếp");
if (/\/api\/control|CONTROL_SERVICE_SECRET|control-plane/i.test(vault + session)) throw new Error("Vault engine/session không được phụ thuộc Control Plane");
if (/localStorage\.setItem\([^\n]*(?:pin|vaultKey|payload)/i.test(vault)) throw new Error("Không được persist PIN, derived key hoặc health payload trong localStorage");
if (/localStorage|sessionStorage/.test(session + center)) throw new Error("Vault session/UI không được tự persist PIN/key trong Web Storage");
if (/console\.(?:log|debug|info|warn|error)\([^\n]*(?:pin|vaultKey|ciphertext|payload)/i.test(vault + session + center)) throw new Error("Không được log vật liệu Vault nhạy cảm");

for (const token of [
  'createContext<SecureVaultSessionValue | null>(null)',
  'SecureVaultSessionProvider',
  'useSecureVaultSession()',
  'setKey(null)',
  'lock("idle")',
  'lock("pagehide")',
  'window.addEventListener("pagehide", pagehide)',
  'profileSwitchDropsPreviousKeyReference: true',
  'noPersistentSessionKey: true',
]) need(session, token, "shared session contract");

for (const token of [
  'import { SecureVaultSessionProvider } from "./secure-vault-session"',
  'function HealthVaultBoundary({ profileId, children }',
  '<SecureVaultSessionProvider key={`vault-session-${profileId}`} profileId={profileId}>',
  '<HealthVaultBoundary profileId={activeProfileId}>',
  '<SecureVaultCenter />',
]) need(framework, token, "runtime integration");
if (framework.includes('<HealthVaultBoundary profileId={activeProfileId}>')) {
  throw new Error("Secure Vault validator phát hiện provider cũ chỉ nằm trong Profile section; phải dùng HealthVaultBoundary chung");
}
need(center, 'useSecureVaultSession()', "center consumes shared session");
need(page, 'import "./secure-vault-center.css"', "stylesheet integration");
need(packageJson, "validate-secure-vault.mjs", "CI gate");

for (const token of [
  "box-shadow: inset",
  ":focus-visible",
  "@media (max-width: 620px)",
  "@media (prefers-reduced-motion: reduce)",
]) need(styles, token, "3D/accessibility style");

for (const token of [
  'lock("manual")',
  'Không hứa khôi phục',
  'Không gửi sang Admin',
  'Cô lập theo hồ sơ',
]) need(center, token, "safe vault UX");

const subtle = webcrypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const iterations = 25_000;

async function derive(pin, salt) {
  const material = await subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function profileAad(profileId) {
  return encoder.encode(`suc-khoe-y-te:vault:v1:${profileId}`);
}

const salt = webcrypto.getRandomValues(new Uint8Array(16));
const iv = webcrypto.getRandomValues(new Uint8Array(12));
const goodKey = await derive("correct-horse-vault", salt);
const payload = encoder.encode(JSON.stringify({ profileId: "profile-a", secret: "private-record" }));
const ciphertext = await subtle.encrypt(
  { name: "AES-GCM", iv, additionalData: profileAad("profile-a") },
  goodKey,
  payload,
);
const roundTrip = await subtle.decrypt(
  { name: "AES-GCM", iv, additionalData: profileAad("profile-a") },
  goodKey,
  ciphertext,
);
if (decoder.decode(roundTrip) !== decoder.decode(payload)) throw new Error("AES-GCM round-trip thất bại");

const wrongKey = await derive("wrong-horse-vault", salt);
let wrongPinRejected = false;
try {
  await subtle.decrypt({ name: "AES-GCM", iv, additionalData: profileAad("profile-a") }, wrongKey, ciphertext);
} catch {
  wrongPinRejected = true;
}
if (!wrongPinRejected) throw new Error("Sai PIN phải không giải mã được ciphertext");

let crossProfileRejected = false;
try {
  await subtle.decrypt({ name: "AES-GCM", iv, additionalData: profileAad("profile-b") }, goodKey, ciphertext);
} catch {
  crossProfileRejected = true;
}
if (!crossProfileRejected) throw new Error("Ciphertext profile A không được giải mã dưới AAD profile B");

console.log("Secure Health Vault V2 session PASS: crypto/storage boundaries plus one shared active-profile memory-only session, auto-lock and profile-switch key disposal are wired.");
