from pathlib import Path

# ---- health-secure-vault.ts ----
p = Path("app/suc-khoe-tre/health-secure-vault.ts")
text = p.read_text()

text = text.replace("type VaultConfig = {", "export type VaultConfig = {", 1)

config_anchor = '''export type VaultConfig = {
  schemaVersion: 1;
  profileId: string;
  salt: string;
  iterations: number;
  checkIv: string;
  checkCiphertext: string;
  createdAt: string;
};
'''
backup_types = '''export type VaultConfig = {
  schemaVersion: 1;
  profileId: string;
  salt: string;
  iterations: number;
  checkIv: string;
  checkCiphertext: string;
  createdAt: string;
};

export type VaultEncryptedBackupV1 = {
  format: "suc-khoe-y-te-secure-vault-backup-v1";
  schemaVersion: 1;
  sourceProfileId: string;
  exportedAt: string;
  recordCount: number;
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    salt: string;
    iterations: number;
  };
  cipher: {
    name: "AES-GCM";
    iv: string;
    ciphertext: string;
  };
};

type VaultBackupInnerV1 = {
  schemaVersion: 1;
  sourceProfileId: string;
  records: VaultPayloadEnvelope[];
};

export type VaultRestoreResult = {
  key: CryptoKey;
  importedCount: number;
  sourceProfileId: string;
};
'''
if "export type VaultEncryptedBackupV1" not in text:
    if config_anchor not in text:
        raise SystemExit("VaultConfig anchor not found")
    text = text.replace(config_anchor, backup_types, 1)

const_anchor = 'export const VAULT_MIN_PIN_LENGTH = 8;\n'
const_extra = '''export const VAULT_MIN_PIN_LENGTH = 8;
export const VAULT_BACKUP_FORMAT = "suc-khoe-y-te-secure-vault-backup-v1";
export const VAULT_BACKUP_MAX_BYTES = 10 * 1024 * 1024;
export const VAULT_BACKUP_MAX_RECORDS = 5000;
'''
if "VAULT_BACKUP_FORMAT" not in text:
    if const_anchor not in text:
        raise SystemExit("vault constants anchor not found")
    text = text.replace(const_anchor, const_extra, 1)

aad_anchor = '''function aad(profileId: string) {
  return new TextEncoder().encode(`suc-khoe-y-te:vault:v1:${profileId}`);
}
'''
aad_extra = '''function aad(profileId: string) {
  return new TextEncoder().encode(`suc-khoe-y-te:vault:v1:${profileId}`);
}

function backupAad(profileId: string) {
  return new TextEncoder().encode(`suc-khoe-y-te:vault-backup:v1:${profileId}`);
}
'''
if "function backupAad(profileId: string)" not in text:
    if aad_anchor not in text:
        raise SystemExit("AAD anchor not found")
    text = text.replace(aad_anchor, aad_extra, 1)

# Batch write + rollback helpers after idbDelete.
idb_delete_anchor = '''async function idbDelete(profileId: string, recordId: string) {
  const db = await openVaultDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, "readwrite");
    const request = transaction.objectStore(VAULT_STORE_NAME).delete(storeKey(profileId, recordId));
    let requestError: DOMException | null = null;
    request.onerror = () => { requestError = request.error; };
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Không xóa được bản ghi Vault.")); };
    transaction.onabort = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Giao dịch Secure Vault bị hủy.")); };
  });
}
'''
idb_extra = idb_delete_anchor + '''
async function idbPutMany(records: VaultStoredRecord[]) {
  if (!records.length) {
    await ensureVaultStorageAvailable();
    return;
  }
  const db = await openVaultDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(VAULT_STORE_NAME);
    let requestError: DOMException | null = null;
    for (const record of records) {
      const request = store.put(record);
      request.onerror = () => { requestError = request.error; };
    }
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Không ghi được bản sao Secure Vault.")); };
    transaction.onabort = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Giao dịch khôi phục Secure Vault bị hủy.")); };
  });
}

async function idbDeleteProfile(profileId: string) {
  const records = await idbList(profileId);
  if (!records.length) return;
  const db = await openVaultDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(VAULT_STORE_NAME);
    let requestError: DOMException | null = null;
    for (const record of records) {
      const request = store.delete(record.key);
      request.onerror = () => { requestError = request.error; };
    }
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Không rollback được Secure Vault.")); };
    transaction.onabort = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Rollback Secure Vault bị hủy.")); };
  });
}
'''
if "async function idbPutMany" not in text:
    if idb_delete_anchor not in text:
        raise SystemExit("idbDelete anchor not found")
    text = text.replace(idb_delete_anchor, idb_extra, 1)

count_anchor = '''export async function countVaultRecords(key: CryptoKey, profileId: string) {
  return (await listVaultRecords(key, profileId)).length;
}
'''
backup_logic = count_anchor + '''
function decodeBase64Field(value: unknown, label: string, expectedBytes: number | null = null) {
  if (typeof value !== "string" || value.length < 4 || value.length > VAULT_BACKUP_MAX_BYTES * 2 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`Bản sao Secure Vault có ${label} không hợp lệ.`);
  }
  try {
    const bytes = base64ToBytes(value);
    if (expectedBytes !== null && bytes.byteLength !== expectedBytes) throw new Error("invalid-size");
    return value;
  } catch {
    throw new Error(`Bản sao Secure Vault có ${label} không hợp lệ.`);
  }
}

function normalizeVaultBackup(value: unknown): VaultEncryptedBackupV1 {
  if (!value || typeof value !== "object") throw new Error("Tệp không phải bản sao Secure Vault hợp lệ.");
  const source = value as Partial<VaultEncryptedBackupV1>;
  if (source.format !== VAULT_BACKUP_FORMAT || source.schemaVersion !== 1) throw new Error("Phiên bản bản sao Secure Vault không được hỗ trợ.");
  const sourceProfileId = typeof source.sourceProfileId === "string" ? source.sourceProfileId.trim() : "";
  if (!sourceProfileId || sourceProfileId.length > 160) throw new Error("Bản sao Secure Vault thiếu profile nguồn hợp lệ.");
  const recordCount = Number(source.recordCount);
  if (!Number.isInteger(recordCount) || recordCount < 0 || recordCount > VAULT_BACKUP_MAX_RECORDS) throw new Error("Số bản ghi trong bản sao Secure Vault không hợp lệ.");
  if (!source.kdf || source.kdf.name !== "PBKDF2" || source.kdf.hash !== "SHA-256") throw new Error("KDF của bản sao Secure Vault không hợp lệ.");
  const iterations = Number(source.kdf.iterations);
  if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) throw new Error("Số vòng PBKDF2 của bản sao Secure Vault không hợp lệ.");
  if (!source.cipher || source.cipher.name !== "AES-GCM") throw new Error("Cipher của bản sao Secure Vault không hợp lệ.");
  return {
    format: VAULT_BACKUP_FORMAT,
    schemaVersion: 1,
    sourceProfileId,
    exportedAt: typeof source.exportedAt === "string" ? source.exportedAt.slice(0, 50) : new Date(0).toISOString(),
    recordCount,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: decodeBase64Field(source.kdf.salt, "salt", 16),
      iterations,
    },
    cipher: {
      name: "AES-GCM",
      iv: decodeBase64Field(source.cipher.iv, "IV", 12),
      ciphertext: decodeBase64Field(source.cipher.ciphertext, "ciphertext"),
    },
  };
}

export function parseVaultBackup(text: string) {
  const byteLength = new TextEncoder().encode(text).byteLength;
  if (byteLength > VAULT_BACKUP_MAX_BYTES) throw new Error("Tệp Secure Vault vượt giới hạn 10 MB của phiên bản hiện tại.");
  try {
    return normalizeVaultBackup(JSON.parse(text));
  } catch (error) {
    if (error instanceof Error && error.message.includes("Secure Vault")) throw error;
    throw new Error("Không đọc được định dạng bản sao Secure Vault.");
  }
}

export async function exportVaultBackup(key: CryptoKey, profileId: string): Promise<VaultEncryptedBackupV1> {
  assertRuntimeSupported();
  await assertKeyMatchesProfile(key, profileId);
  const config = readConfig(profileId);
  if (!config) throw new Error("Secure Vault chưa được cấu hình cho hồ sơ này.");
  const stored = await idbList(profileId);
  if (stored.length > VAULT_BACKUP_MAX_RECORDS) throw new Error("Secure Vault vượt giới hạn số bản ghi có thể sao lưu ở V1.");
  const payloads: VaultPayloadEnvelope[] = [];
  for (const record of stored) payloads.push(await decryptStoredRecord(key, profileId, record));
  const inner: VaultBackupInnerV1 = { schemaVersion: 1, sourceProfileId: profileId, records: payloads };
  const plain = new TextEncoder().encode(JSON.stringify(inner));
  if (plain.byteLength > VAULT_BACKUP_MAX_BYTES) throw new Error("Secure Vault vượt giới hạn 10 MB của bản sao V1.");
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: backupAad(profileId) },
    key,
    plain,
  );
  const backup: VaultEncryptedBackupV1 = {
    format: VAULT_BACKUP_FORMAT,
    schemaVersion: 1,
    sourceProfileId: profileId,
    exportedAt: new Date().toISOString(),
    recordCount: payloads.length,
    kdf: { name: "PBKDF2", hash: "SHA-256", salt: config.salt, iterations: config.iterations },
    cipher: { name: "AES-GCM", iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) },
  };
  if (new TextEncoder().encode(JSON.stringify(backup)).byteLength > VAULT_BACKUP_MAX_BYTES) throw new Error("Tệp Secure Vault vượt giới hạn 10 MB sau khi mã hóa.");
  return backup;
}

export async function restoreVaultBackup(targetProfileId: string, pin: string, input: VaultEncryptedBackupV1): Promise<VaultRestoreResult> {
  assertRuntimeSupported();
  if (!targetProfileId) throw new Error("Thiếu hồ sơ đích để khôi phục Secure Vault.");
  assertPin(pin);
  if (readConfig(targetProfileId)) throw new Error("Hồ sơ đích đã có Secure Vault; V1 không merge hoặc ghi đè.");
  const existing = await idbList(targetProfileId);
  if (existing.length) throw new Error("Hồ sơ đích đã có dữ liệu Vault; V1 không ghi đè.");
  const backup = normalizeVaultBackup(input);
  const sourceKey = await deriveVaultKey(pin, base64ToBytes(backup.kdf.salt), backup.kdf.iterations);
  let inner: VaultBackupInnerV1;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(backup.cipher.iv), additionalData: backupAad(backup.sourceProfileId) },
      sourceKey,
      base64ToBytes(backup.cipher.ciphertext),
    );
    inner = JSON.parse(new TextDecoder().decode(plain)) as VaultBackupInnerV1;
  } catch {
    throw new Error("Mã khóa bản sao không đúng hoặc tệp Secure Vault đã bị thay đổi/hỏng.");
  }
  if (inner.schemaVersion !== 1 || inner.sourceProfileId !== backup.sourceProfileId || !Array.isArray(inner.records) || inner.records.length !== backup.recordCount || inner.records.length > VAULT_BACKUP_MAX_RECORDS) {
    throw new Error("Nội dung bên trong bản sao Secure Vault không hợp lệ.");
  }
  const payloads: VaultPayloadEnvelope[] = [];
  for (const raw of inner.records) {
    if (!raw || typeof raw !== "object" || typeof raw.recordId !== "string" || !raw.recordId || raw.recordId.length > 220) throw new Error("Bản sao Secure Vault chứa recordId không hợp lệ.");
    payloads.push(validatePayload(raw, backup.sourceProfileId, raw.recordId));
  }

  const targetSalt = randomBytes(16);
  const targetKey = await deriveVaultKey(pin, targetSalt, VAULT_PBKDF2_ITERATIONS);
  const check = await encryptBytes(targetKey, targetProfileId, new TextEncoder().encode(VAULT_CHECK_TEXT));
  const targetConfig: VaultConfig = {
    schemaVersion: 1,
    profileId: targetProfileId,
    salt: bytesToBase64(targetSalt),
    iterations: VAULT_PBKDF2_ITERATIONS,
    checkIv: check.iv,
    checkCiphertext: check.ciphertext,
    createdAt: new Date().toISOString(),
  };

  const reencrypted: VaultStoredRecord[] = [];
  for (const payload of payloads) {
    const rebound: VaultPayloadEnvelope = { ...payload, profileId: targetProfileId };
    const encrypted = await encryptBytes(targetKey, targetProfileId, new TextEncoder().encode(JSON.stringify(rebound)));
    reencrypted.push({
      key: storeKey(targetProfileId, rebound.recordId),
      profileId: targetProfileId,
      recordId: rebound.recordId,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      updatedAt: rebound.updatedAt,
    });
  }

  await idbPutMany(reencrypted);
  try {
    writeConfig(targetConfig);
  } catch {
    await idbDeleteProfile(targetProfileId);
    throw new Error("Không persist được cấu hình Vault đích; dữ liệu khôi phục đã được rollback.");
  }
  return { key: targetKey, importedCount: reencrypted.length, sourceProfileId: backup.sourceProfileId };
}
'''
if "export async function exportVaultBackup" not in text:
    if count_anchor not in text:
        raise SystemExit("countVaultRecords anchor not found")
    text = text.replace(count_anchor, backup_logic, 1)

guard_anchor = '''  noRecoveryClaimWithoutRecoveryMechanism: true,
  existingBaselineStateNotSilentlyMigrated: true,
'''
guard_extra = '''  noRecoveryClaimWithoutRecoveryMechanism: true,
  encryptedPortableBackup: true,
  backupOuterContainsNoRecordPlaintext: true,
  backupDoesNotRecoverForgottenPin: true,
  restoreNeverOverwritesExistingVault: true,
  existingBaselineStateNotSilentlyMigrated: true,
'''
if "encryptedPortableBackup: true" not in text:
    if guard_anchor not in text:
        raise SystemExit("guardrail anchor not found")
    text = text.replace(guard_anchor, guard_extra, 1)

p.write_text(text)

# ---- secure-vault-session.tsx ----
p = Path("app/suc-khoe-tre/secure-vault-session.tsx")
text = p.read_text()

import_anchor = '''  countVaultRecords,
  setupVault,
  unlockVault,
'''
import_new = '''  countVaultRecords,
  restoreVaultBackup,
  setupVault,
  unlockVault,
'''
if "restoreVaultBackup," not in text:
    if import_anchor not in text:
        raise SystemExit("session import anchor not found")
    text = text.replace(import_anchor, import_new, 1)

type_import_anchor = '''  type VaultStatus,
} from "./health-secure-vault";
'''
type_import_new = '''  type VaultEncryptedBackupV1,
  type VaultStatus,
} from "./health-secure-vault";
'''
if "type VaultEncryptedBackupV1" not in text:
    if type_import_anchor not in text:
        raise SystemExit("session type import anchor not found")
    text = text.replace(type_import_anchor, type_import_new, 1)

value_anchor = '''  unlock: (pin: string) => Promise<void>;
  lock: (reason?: VaultLockReason) => void;
'''
value_new = '''  unlock: (pin: string) => Promise<void>;
  restoreFromBackup: (backup: VaultEncryptedBackupV1, pin: string) => Promise<number>;
  lock: (reason?: VaultLockReason) => void;
'''
if "restoreFromBackup: (backup: VaultEncryptedBackupV1" not in text:
    if value_anchor not in text:
        raise SystemExit("session value anchor not found")
    text = text.replace(value_anchor, value_new, 1)

refresh_anchor = '''  const refreshRecordCount = useCallback(async () => {
'''
restore_callback = '''  const restoreFromBackup = useCallback(async (backup: VaultEncryptedBackupV1, pin: string) => {
    const restored = await restoreVaultBackup(profileId, pin, backup);
    setKey(restored.key);
    setRecordCount(restored.importedCount);
    setLockReason(null);
    setStatus("unlocked");
    return restored.importedCount;
  }, [profileId]);

  const refreshRecordCount = useCallback(async () => {
'''
if "const restoreFromBackup = useCallback(async" not in text:
    if refresh_anchor not in text:
        raise SystemExit("session refresh anchor not found")
    text = text.replace(refresh_anchor, restore_callback, 1)

value_object_anchor = '''    unlock,
    lock,
    refreshRecordCount,
'''
value_object_new = '''    unlock,
    restoreFromBackup,
    lock,
    refreshRecordCount,
'''
if "    restoreFromBackup," not in text:
    if value_object_anchor not in text:
        raise SystemExit("session value object anchor not found")
    text = text.replace(value_object_anchor, value_object_new, 1)

deps_anchor = '''  }), [key, lock, lockReason, profileId, recordCount, refreshRecordCount, setup, status, unlock]);
'''
deps_new = '''  }), [key, lock, lockReason, profileId, recordCount, refreshRecordCount, restoreFromBackup, setup, status, unlock]);
'''
if deps_anchor in text:
    text = text.replace(deps_anchor, deps_new, 1)
elif "refreshRecordCount, restoreFromBackup" not in text:
    raise SystemExit("session deps anchor not found")

p.write_text(text)

# ---- health-framework.tsx ----
p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()
center_import = 'import SecureVaultCenter from "./secure-vault-center";\n'
backup_import = 'import SecureVaultBackupCenter from "./secure-vault-backup-center";\n'
if backup_import not in text:
    if center_import not in text:
        raise SystemExit("framework vault center import anchor not found")
    text = text.replace(center_import, center_import + backup_import, 1)

runtime_anchor = '''            <SecureVaultCenter />
            <PrivateSensitiveNotes />
'''
runtime_new = '''            <SecureVaultCenter />
            <SecureVaultBackupCenter />
            <PrivateSensitiveNotes />
'''
if "<SecureVaultBackupCenter />" not in text:
    if runtime_anchor not in text:
        raise SystemExit("framework vault runtime anchor not found")
    text = text.replace(runtime_anchor, runtime_new, 1)
p.write_text(text)

# ---- page.tsx ----
p = Path("app/suc-khoe-tre/page.tsx")
text = p.read_text()
css_anchor = 'import "./secure-vault-center.css";\n'
css_line = 'import "./secure-vault-backup-center.css";\n'
if css_line not in text:
    if css_anchor not in text:
        raise SystemExit("page vault css anchor not found")
    text = text.replace(css_anchor, css_anchor + css_line, 1)
p.write_text(text)

# ---- package.json ----
p = Path("package.json")
text = p.read_text()
validator_anchor = 'node scripts/validate-private-sensitive-notes.mjs'
validator_new = 'node scripts/validate-private-sensitive-notes.mjs && node scripts/validate-secure-vault-backup.mjs'
if "validate-secure-vault-backup.mjs" not in text:
    if validator_anchor not in text:
        raise SystemExit("package validator anchor not found")
    text = text.replace(validator_anchor, validator_new, 1)
p.write_text(text)
