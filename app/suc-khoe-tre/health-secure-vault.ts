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

type VaultConfig = {
  schemaVersion: 1;
  profileId: string;
  salt: string;
  iterations: number;
  checkIv: string;
  checkCiphertext: string;
  createdAt: string;
};

export const VAULT_CONFIG_PREFIX = "suc-khoe-y-te:vault-config:v1:";
export const VAULT_DB_NAME = "suc-khoe-y-te-vault-v1";
export const VAULT_STORE_NAME = "records";
export const VAULT_PBKDF2_ITERATIONS = 250_000;
export const VAULT_AUTO_LOCK_MS = 10 * 60 * 1000;
export const VAULT_MIN_PIN_LENGTH = 8;
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
  const record = await idbGet(profileId, recordId);
  if (!record) return null;
  return decryptStoredRecord<T>(key, profileId, record);
}

export async function listVaultRecords<T = unknown>(key: CryptoKey, profileId: string) {
  assertRuntimeSupported();
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
  existingBaselineStateNotSilentlyMigrated: true,
} as const;
