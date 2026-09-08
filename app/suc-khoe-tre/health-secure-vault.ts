export type VaultStatus = "unsupported" | "not-configured" | "locked" | "unlocked";

export type VaultPayloadEnvelope<T = unknown> = {
  schemaVersion: 1;
  profileId: string;
  recordId: string;
  domainId: string;
  createdAt: string;
  updatedAt: string;
  data: T;
};

export type VaultStoredRecord = {
  key: string;
  profileId: string;
  recordId: string;
  iv: string;
  ciphertext: string;
  updatedAt: string;
};

export type VaultConfig = {
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

export const VAULT_CONFIG_PREFIX = "suc-khoe-y-te:vault-config:v1:";
export const VAULT_DB_NAME = "suc-khoe-y-te-vault-v1";
export const VAULT_STORE_NAME = "records";
export const VAULT_PBKDF2_ITERATIONS = 250_000;
export const VAULT_AUTO_LOCK_MS = 10 * 60 * 1000;
export const VAULT_MIN_PIN_LENGTH = 8;
export const VAULT_BACKUP_FORMAT = "suc-khoe-y-te-secure-vault-backup-v1";
export const VAULT_BACKUP_MAX_BYTES = 10 * 1024 * 1024;
export const VAULT_BACKUP_MAX_RECORDS = 5000;
const VAULT_MAX_PIN_LENGTH = 128;
const VAULT_CHECK_TEXT = "suc-khoe-y-te-vault-check-v1";

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomBytes(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

function aad(profileId: string) {
  return new TextEncoder().encode(`suc-khoe-y-te:vault:v1:${profileId}`);
}

function backupAad(profileId: string) {
  return new TextEncoder().encode(`suc-khoe-y-te:vault-backup:v1:${profileId}`);
}

function assertPin(pin: string) {
  if (pin.length < VAULT_MIN_PIN_LENGTH) throw new Error(`Mã khóa cần ít nhất ${VAULT_MIN_PIN_LENGTH} ký tự.`);
  if (pin.length > VAULT_MAX_PIN_LENGTH) throw new Error(`Mã khóa không được vượt quá ${VAULT_MAX_PIN_LENGTH} ký tự.`);
}

function assertRuntimeSupported() {
  if (!vaultRuntimeSupported()) throw new Error("Trình duyệt hiện tại không hỗ trợ đầy đủ Web Crypto + IndexedDB cho Secure Vault.");
}

async function deriveVaultKey(pin: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptBytes(key: CryptoKey, profileId: string, plain: Uint8Array) {
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad(profileId) },
    key,
    plain,
  );
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

async function decryptBytes(key: CryptoKey, profileId: string, iv: string, ciphertext: string) {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv), additionalData: aad(profileId) },
    key,
    base64ToBytes(ciphertext),
  );
  return new Uint8Array(plain);
}

function configKey(profileId: string) {
  return `${VAULT_CONFIG_PREFIX}${profileId}`;
}

function readConfig(profileId: string): VaultConfig | null {
  if (typeof window === "undefined" || !profileId) return null;
  try {
    const raw = window.localStorage.getItem(configKey(profileId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<VaultConfig>;
    if (value.schemaVersion !== 1 || value.profileId !== profileId || typeof value.salt !== "string" || typeof value.checkIv !== "string" || typeof value.checkCiphertext !== "string") return null;
    const iterations = Number(value.iterations);
    if (!Number.isInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return null;
    return {
      schemaVersion: 1,
      profileId,
      salt: value.salt,
      iterations,
      checkIv: value.checkIv,
      checkCiphertext: value.checkCiphertext,
      createdAt: typeof value.createdAt === "string" ? value.createdAt.slice(0, 50) : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

function writeConfig(config: VaultConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(configKey(config.profileId), JSON.stringify(config));
}

async function assertKeyMatchesProfile(key: CryptoKey, profileId: string) {
  const config = readConfig(profileId);
  if (!config) throw new Error("Secure Vault chưa được cấu hình cho hồ sơ này.");
  try {
    const check = await decryptBytes(key, profileId, config.checkIv, config.checkCiphertext);
    if (new TextDecoder().decode(check) !== VAULT_CHECK_TEXT) throw new Error("invalid-check");
  } catch {
    throw new Error("Khóa Secure Vault không thuộc hồ sơ đang chọn.");
  }
}

export function vaultRuntimeSupported() {
  return typeof window !== "undefined" && typeof crypto !== "undefined" && Boolean(crypto.subtle) && typeof indexedDB !== "undefined";
}

export function vaultConfigured(profileId: string) {
  return Boolean(readConfig(profileId));
}

function openVaultDb() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Trình duyệt không hỗ trợ IndexedDB cho Secure Vault."));
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(VAULT_DB_NAME, 1);
    request.onerror = () => reject(request.error ?? new Error("Không mở được Secure Vault."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VAULT_STORE_NAME)) {
        const store = db.createObjectStore(VAULT_STORE_NAME, { keyPath: "key" });
        store.createIndex("profileId", "profileId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function ensureVaultStorageAvailable() {
  const db = await openVaultDb();
  db.close();
}

function storeKey(profileId: string, recordId: string) {
  return `${profileId}:${recordId}`;
}

async function idbPut(record: VaultStoredRecord) {
  const db = await openVaultDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, "readwrite");
    const request = transaction.objectStore(VAULT_STORE_NAME).put(record);
    let requestError: DOMException | null = null;
    request.onerror = () => { requestError = request.error; };
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Không ghi được Secure Vault.")); };
    transaction.onabort = () => { db.close(); reject(requestError ?? transaction.error ?? new Error("Giao dịch Secure Vault bị hủy.")); };
  });
}

async function idbGet(profileId: string, recordId: string) {
  const db = await openVaultDb();
  return new Promise<VaultStoredRecord | null>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, "readonly");
    const request = transaction.objectStore(VAULT_STORE_NAME).get(storeKey(profileId, recordId));
    let result: VaultStoredRecord | null = null;
    request.onsuccess = () => { result = (request.result as VaultStoredRecord | undefined) ?? null; };
    request.onerror = () => reject(request.error ?? new Error("Không đọc được Secure Vault."));
    transaction.oncomplete = () => { db.close(); resolve(result); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Lỗi giao dịch Secure Vault.")); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error("Giao dịch Secure Vault bị hủy.")); };
  });
}

async function idbList(profileId: string) {
  const db = await openVaultDb();
  return new Promise<VaultStoredRecord[]>((resolve, reject) => {
    const transaction = db.transaction(VAULT_STORE_NAME, "readonly");
    const request = transaction.objectStore(VAULT_STORE_NAME).index("profileId").getAll(profileId);
    let result: VaultStoredRecord[] = [];
    request.onsuccess = () => { result = (request.result ?? []) as VaultStoredRecord[]; };
    request.onerror = () => reject(request.error ?? new Error("Không đọc được Secure Vault."));
    transaction.oncomplete = () => { db.close(); resolve(result); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Lỗi giao dịch Secure Vault.")); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error("Giao dịch Secure Vault bị hủy.")); };
  });
}

async function idbDelete(profileId: string, recordId: string) {
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

function validatePayload<T>(payload: VaultPayloadEnvelope<T>, expectedProfileId: string, expectedRecordId: string) {
  if (payload.schemaVersion !== 1 || payload.profileId !== expectedProfileId || payload.recordId !== expectedRecordId || !payload.domainId) {
    throw new Error("Bản ghi Secure Vault không khớp định danh hồ sơ.");
  }
  return payload;
}

async function decryptStoredRecord<T>(key: CryptoKey, profileId: string, record: VaultStoredRecord) {
  const bytes = await decryptBytes(key, profileId, record.iv, record.ciphertext);
  const payload = JSON.parse(new TextDecoder().decode(bytes)) as VaultPayloadEnvelope<T>;
  return validatePayload(payload, profileId, record.recordId);
}

export async function setupVault(profileId: string, pin: string) {
  assertRuntimeSupported();
  if (!profileId) throw new Error("Thiếu hồ sơ cho Secure Vault.");
  assertPin(pin);
  if (readConfig(profileId)) throw new Error("Secure Vault của hồ sơ này đã được cấu hình.");
  await ensureVaultStorageAvailable();
  const salt = randomBytes(16);
  const key = await deriveVaultKey(pin, salt, VAULT_PBKDF2_ITERATIONS);
  const check = await encryptBytes(key, profileId, new TextEncoder().encode(VAULT_CHECK_TEXT));
  writeConfig({
    schemaVersion: 1,
    profileId,
    salt: bytesToBase64(salt),
    iterations: VAULT_PBKDF2_ITERATIONS,
    checkIv: check.iv,
    checkCiphertext: check.ciphertext,
    createdAt: new Date().toISOString(),
  });
  return key;
}

export async function unlockVault(profileId: string, pin: string) {
  assertRuntimeSupported();
  assertPin(pin);
  const config = readConfig(profileId);
  if (!config) throw new Error("Secure Vault chưa được cấu hình.");
  const key = await deriveVaultKey(pin, base64ToBytes(config.salt), config.iterations);
  try {
    const check = await decryptBytes(key, profileId, config.checkIv, config.checkCiphertext);
    if (new TextDecoder().decode(check) !== VAULT_CHECK_TEXT) throw new Error("invalid-check");
    return key;
  } catch {
    throw new Error("Mã khóa không đúng hoặc dữ liệu Vault không thể giải mã.");
  }
}

export async function putVaultRecord<T>(key: CryptoKey, payload: VaultPayloadEnvelope<T>) {
  assertRuntimeSupported();
  await assertKeyMatchesProfile(key, payload.profileId);
  if (!payload.profileId || !payload.recordId || !payload.domainId) throw new Error("Bản ghi Vault thiếu định danh.");
  const encrypted = await encryptBytes(key, payload.profileId, new TextEncoder().encode(JSON.stringify(payload)));
  await idbPut({
    key: storeKey(payload.profileId, payload.recordId),
    profileId: payload.profileId,
    recordId: payload.recordId,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
    updatedAt: payload.updatedAt,
  });
}

export async function getVaultRecord<T = unknown>(key: CryptoKey, profileId: string, recordId: string) {
  assertRuntimeSupported();
  await assertKeyMatchesProfile(key, profileId);
  const record = await idbGet(profileId, recordId);
  if (!record) return null;
  return decryptStoredRecord<T>(key, profileId, record);
}

export async function listVaultRecords<T = unknown>(key: CryptoKey, profileId: string) {
  assertRuntimeSupported();
  await assertKeyMatchesProfile(key, profileId);
  const records = await idbList(profileId);
  const output: VaultPayloadEnvelope<T>[] = [];
  for (const record of records) output.push(await decryptStoredRecord<T>(key, profileId, record));
  return output.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteVaultRecord(key: CryptoKey, profileId: string, recordId: string) {
  assertRuntimeSupported();
  const existing = await getVaultRecord(key, profileId, recordId);
  if (!existing) return false;
  await idbDelete(profileId, recordId);
  return true;
}

export async function countVaultRecords(key: CryptoKey, profileId: string) {
  return (await listVaultRecords(key, profileId)).length;
}

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

export function redactSensitiveNotification(title: string, isHighlySensitive: boolean) {
  return isHighlySensitive ? "Nhắc việc sức khỏe riêng tư" : title;
}

export const SECURE_VAULT_V1_GUARDRAILS = {
  pinIsNeverPersisted: true,
  derivedKeyIsMemoryOnly: true,
  aesGcmForPayloadEncryption: true,
  pbkdf2Sha256ForPinDerivation: true,
  profileBoundAuthenticatedData: true,
  healthPayloadNotStoredInLocalStorage: true,
  destructiveRecordOperationsRequireUnlockedKey: true,
  adminReceivesNoVaultKeyOrPayload: true,
  noRecoveryClaimWithoutRecoveryMechanism: true,
  encryptedPortableBackup: true,
  backupOuterContainsNoRecordPlaintext: true,
  backupDoesNotRecoverForgottenPin: true,
  restoreNeverOverwritesExistingVault: true,
  existingBaselineStateNotSilentlyMigrated: true,
} as const;
