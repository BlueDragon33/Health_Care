from pathlib import Path

framework_path = Path("app/suc-khoe-tre/health-framework.tsx")
framework = framework_path.read_text()
import_anchor = 'import PrivacyCenter from "./privacy-center";\n'
if import_anchor not in framework:
    raise SystemExit("PrivacyCenter import anchor not found")
if 'import SecureVaultCenter from "./secure-vault-center";' not in framework:
    framework = framework.replace(import_anchor, import_anchor + 'import SecureVaultCenter from "./secure-vault-center";\n', 1)

privacy_anchor = '          {activeProfileId ? <PrivacyCenter key={activeProfileId} profileId={activeProfileId} /> : null}\n'
if privacy_anchor not in framework:
    raise SystemExit("PrivacyCenter runtime anchor not found")
vault_runtime = '          {activeProfileId ? <SecureVaultCenter key={`vault-${activeProfileId}`} profileId={activeProfileId} /> : null}\n'
if vault_runtime not in framework:
    framework = framework.replace(privacy_anchor, privacy_anchor + vault_runtime, 1)
framework_path.write_text(framework)

vault_path = Path("app/suc-khoe-tre/health-secure-vault.ts")
vault = vault_path.read_text()
helper_anchor = '''function writeConfig(config: VaultConfig) {\n  if (typeof window === "undefined") return;\n  window.localStorage.setItem(configKey(config.profileId), JSON.stringify(config));\n}\n'''
helper = '''function writeConfig(config: VaultConfig) {\n  if (typeof window === "undefined") return;\n  window.localStorage.setItem(configKey(config.profileId), JSON.stringify(config));\n}\n\nasync function assertKeyMatchesProfile(key: CryptoKey, profileId: string) {\n  const config = readConfig(profileId);\n  if (!config) throw new Error("Secure Vault chưa được cấu hình cho hồ sơ này.");\n  try {\n    const check = await decryptBytes(key, profileId, config.checkIv, config.checkCiphertext);\n    if (new TextDecoder().decode(check) !== VAULT_CHECK_TEXT) throw new Error("invalid-check");\n  } catch {\n    throw new Error("Khóa Secure Vault không thuộc hồ sơ đang chọn.");\n  }\n}\n'''
if helper_anchor not in vault:
    raise SystemExit("writeConfig anchor not found")
if 'async function assertKeyMatchesProfile' not in vault:
    vault = vault.replace(helper_anchor, helper, 1)

replacements = [
    (
        'export async function putVaultRecord<T>(key: CryptoKey, payload: VaultPayloadEnvelope<T>) {\n  assertRuntimeSupported();\n  if (!payload.profileId',
        'export async function putVaultRecord<T>(key: CryptoKey, payload: VaultPayloadEnvelope<T>) {\n  assertRuntimeSupported();\n  await assertKeyMatchesProfile(key, payload.profileId);\n  if (!payload.profileId',
    ),
    (
        'export async function getVaultRecord<T = unknown>(key: CryptoKey, profileId: string, recordId: string) {\n  assertRuntimeSupported();\n  const record',
        'export async function getVaultRecord<T = unknown>(key: CryptoKey, profileId: string, recordId: string) {\n  assertRuntimeSupported();\n  await assertKeyMatchesProfile(key, profileId);\n  const record',
    ),
    (
        'export async function listVaultRecords<T = unknown>(key: CryptoKey, profileId: string) {\n  assertRuntimeSupported();\n  const records',
        'export async function listVaultRecords<T = unknown>(key: CryptoKey, profileId: string) {\n  assertRuntimeSupported();\n  await assertKeyMatchesProfile(key, profileId);\n  const records',
    ),
]
for old, new in replacements:
    if old not in vault:
        raise SystemExit(f"vault anchor not found: {old[:70]}")
    vault = vault.replace(old, new, 1)

vault_path.write_text(vault)
