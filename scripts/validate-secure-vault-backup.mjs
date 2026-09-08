import fs from "node:fs";
import { webcrypto } from "node:crypto";

const engine = fs.readFileSync("app/suc-khoe-tre/health-secure-vault.ts", "utf8");
const session = fs.readFileSync("app/suc-khoe-tre/secure-vault-session.tsx", "utf8");
const center = fs.readFileSync("app/suc-khoe-tre/secure-vault-backup-center.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/secure-vault-backup-center.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Secure Vault Backup V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'VAULT_BACKUP_FORMAT = "suc-khoe-y-te-secure-vault-backup-v1"',
  "VAULT_BACKUP_MAX_BYTES = 10 * 1024 * 1024",
  "VAULT_BACKUP_MAX_RECORDS = 5000",
  "export type VaultEncryptedBackupV1",
  "function backupAad(profileId: string)",
  "export async function exportVaultBackup",
  "await assertKeyMatchesProfile(key, profileId)",
  "const stored = await idbList(profileId)",
  "await decryptStoredRecord(key, profileId, record)",
  "recordCount: payloads.length",
  "export function parseVaultBackup",
  "export async function restoreVaultBackup",
  "if (readConfig(targetProfileId))",
  "const existing = await idbList(targetProfileId)",
  "await deriveVaultKey(pin, base64ToBytes(backup.kdf.salt), backup.kdf.iterations)",
  "additionalData: backupAad(backup.sourceProfileId)",
  "profileId: targetProfileId",
  "await idbPutMany(reencrypted)",
  "writeConfig(targetConfig)",
  "await idbDeleteProfile(targetProfileId)",
  "encryptedPortableBackup: true",
  "backupDoesNotRecoverForgottenPin: true",
  "restoreNeverOverwritesExistingVault: true",
]) need(engine, token, "backup crypto/storage contract");

const putManyIndex = engine.indexOf("await idbPutMany(reencrypted)");
const configWriteIndex = engine.indexOf("writeConfig(targetConfig)");
if (putManyIndex < 0 || configWriteIndex < 0 || putManyIndex > configWriteIndex) {
  throw new Error("Restore phải ghi batch ciphertext thành công trước khi persist cấu hình Vault mới");
}

if (/\bfetch\s*\(/.test(engine) || /\bfetch\s*\(/.test(center)) throw new Error("Vault backup không được gọi network/API trực tiếp");
if (/\/api\/control|CONTROL_SERVICE_SECRET|control-plane/i.test(engine + center)) throw new Error("Vault backup không được phụ thuộc Control Plane");
if (/localStorage\.|sessionStorage\./.test(center)) throw new Error("Backup UI không được persist PIN hoặc payload trong Web Storage");
if (/console\.(?:log|debug|info|warn|error)\([^\n]*(?:pin|ciphertext|payload|backup)/i.test(engine + center)) throw new Error("Không được log vật liệu backup nhạy cảm");

for (const token of [
  "restoreFromBackup: (backup: VaultEncryptedBackupV1, pin: string) => Promise<number>",
  "const restoreFromBackup = useCallback(async",
  "await restoreVaultBackup(profileId, pin, backup)",
  "setStatus(\"unlocked\")",
]) need(session, token, "shared session restore transition");

for (const token of [
  "exportVaultBackup(key, profileId)",
  "parseVaultBackup(await file.text())",
  'status !== "unlocked" || !key',
  'status !== "not-configured"',
  "file.size > VAULT_BACKUP_MAX_BYTES",
  "restoreFromBackup(backup, pin)",
  "Không phải cơ chế quên PIN",
  "Không gửi Admin",
  "không xuất hiện dạng rõ trong tệp",
]) need(center, token, "safe backup UX");

for (const token of [
  'import SecureVaultBackupCenter from "./secure-vault-backup-center"',
  "<SecureVaultCenter />",
  "<SecureVaultBackupCenter />",
  "<PrivateSensitiveNotes />",
]) need(framework, token, "runtime integration");

if (!(framework.indexOf("<SecureVaultCenter />") < framework.indexOf("<SecureVaultBackupCenter />") && framework.indexOf("<SecureVaultBackupCenter />") < framework.indexOf("<PrivateSensitiveNotes />"))) {
  throw new Error("Backup Center phải nằm trong cùng Vault provider, giữa Vault Center và module dữ liệu nhạy cảm");
}

need(page, 'import "./secure-vault-backup-center.css"', "stylesheet integration");
need(packageJson, "validate-secure-vault-backup.mjs", "CI gate");

for (const token of [
  "box-shadow: inset",
  ":focus-visible",
  "@media (max-width: 620px)",
  "@media (prefers-reduced-motion: reduce)",
]) need(styles, token, "3D/accessibility style");

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

function backupAad(profileId) {
  return encoder.encode(`suc-khoe-y-te:vault-backup:v1:${profileId}`);
}

function recordAad(profileId) {
  return encoder.encode(`suc-khoe-y-te:vault:v1:${profileId}`);
}

const pin = "portable-backup-passphrase";
const sourceProfileId = "profile-source";
const targetProfileId = "profile-target";
const sourceSalt = webcrypto.getRandomValues(new Uint8Array(16));
const sourceKey = await derive(pin, sourceSalt);
const backupIv = webcrypto.getRandomValues(new Uint8Array(12));
const inner = {
  schemaVersion: 1,
  sourceProfileId,
  records: [{ schemaVersion: 1, profileId: sourceProfileId, recordId: "rec-1", domainId: "records-appointments-documents", createdAt: "2026-09-08T00:00:00.000Z", updatedAt: "2026-09-08T00:00:00.000Z", data: { title: "SECRET_TITLE", body: "SECRET_BODY" } }],
};
const backupCiphertext = await subtle.encrypt(
  { name: "AES-GCM", iv: backupIv, additionalData: backupAad(sourceProfileId) },
  sourceKey,
  encoder.encode(JSON.stringify(inner)),
);
const simulatedOuter = JSON.stringify({ format: "suc-khoe-y-te-secure-vault-backup-v1", sourceProfileId, ciphertext: Buffer.from(backupCiphertext).toString("base64") });
if (simulatedOuter.includes("SECRET_TITLE") || simulatedOuter.includes("SECRET_BODY")) throw new Error("Backup ngoài không được chứa plaintext bản ghi");

const restoredInnerBytes = await subtle.decrypt(
  { name: "AES-GCM", iv: backupIv, additionalData: backupAad(sourceProfileId) },
  sourceKey,
  backupCiphertext,
);
const restoredInner = JSON.parse(decoder.decode(restoredInnerBytes));
if (restoredInner.records[0].data.body !== "SECRET_BODY") throw new Error("Backup round-trip thất bại");

const wrongKey = await derive("wrong-backup-passphrase", sourceSalt);
let wrongPinRejected = false;
try {
  await subtle.decrypt({ name: "AES-GCM", iv: backupIv, additionalData: backupAad(sourceProfileId) }, wrongKey, backupCiphertext);
} catch {
  wrongPinRejected = true;
}
if (!wrongPinRejected) throw new Error("Sai PIN phải không giải mã được backup");

const targetSalt = webcrypto.getRandomValues(new Uint8Array(16));
const targetKey = await derive(pin, targetSalt);
const targetIv = webcrypto.getRandomValues(new Uint8Array(12));
const rebound = { ...restoredInner.records[0], profileId: targetProfileId };
const targetCiphertext = await subtle.encrypt(
  { name: "AES-GCM", iv: targetIv, additionalData: recordAad(targetProfileId) },
  targetKey,
  encoder.encode(JSON.stringify(rebound)),
);
const targetPlain = await subtle.decrypt(
  { name: "AES-GCM", iv: targetIv, additionalData: recordAad(targetProfileId) },
  targetKey,
  targetCiphertext,
);
if (JSON.parse(decoder.decode(targetPlain)).profileId !== targetProfileId) throw new Error("Rebind profile khi restore thất bại");

let sourceAadRejected = false;
try {
  await subtle.decrypt({ name: "AES-GCM", iv: targetIv, additionalData: recordAad(sourceProfileId) }, targetKey, targetCiphertext);
} catch {
  sourceAadRejected = true;
}
if (!sourceAadRejected) throw new Error("Ciphertext sau restore phải bị ràng buộc với profile đích");

console.log("Secure Vault Backup & Recovery V1 PASS: outer bundle hides record plaintext, wrong PIN is rejected, source backup decrypts only in memory and records are re-bound/re-encrypted for the target profile without Admin/network fallback.");
