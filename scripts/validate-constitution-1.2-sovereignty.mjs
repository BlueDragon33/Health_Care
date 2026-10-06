import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path,"utf8");
const json = path => JSON.parse(read(path));

const adoption=json(".blueprint/constitution-adoption.json");
const budget=json("docs/DEPENDENCY_BUDGET.json");
const backup=read("docs/SECURE_VAULT_BACKUP_RECOVERY_V1.md");
const release=read("docs/DEVELOPMENT_RELEASE_POLICY.md");

assert.equal(adoption.policyVersion,"1.2.0");
assert.ok(
  adoption.inheritedPillars.includes("operational-sovereignty-dependency-minimization"),
  "missing Constitution 1.2 sovereignty pillar"
);
assert.deepEqual(adoption.disabledPillars,[]);
assert.deepEqual(adoption.constitutionalWaivers,[]);

assert.equal(
  budget.constitutionPolicy,
  "blueprint-os:universal-century-grade@1.2.0"
);
assert.equal(
  budget.defaultPrinciple,
  "LOCAL_CANONICAL_SENSITIVE_DATA_OFFLINE_FIRST_ENCRYPTED_OPTIONAL_SYNC"
);

const byId=new Map(budget.dependencies.map(item=>[item.id,item]));
assert.equal(byId.get("secure-local-vault")?.runtimeClass,"LOCAL_CORE");
assert.equal(byId.get("chatgpt-ai")?.runtimeClass,"OPTIONAL_INTELLIGENCE");
assert.equal(byId.get("google-drive-backup")?.runtimeClass,"OPTIONAL_SYNC");
assert.equal(byId.get("google-sheets")?.runtimeClass,"OPTIONAL_SYNC");
assert.equal(byId.get("google-apps-script")?.runtimeClass,"OPTIONAL_SYNC");
assert.match(byId.get("google-drive-backup")?.dataBoundary ?? "",/encrypted backup artifact only/i);
assert.match(byId.get("google-sheets")?.canonicalState ?? "",/forbidden/i);
assert.match(byId.get("google-apps-script")?.canonicalState ?? "",/forbidden/i);

for (const required of [
  "Secure Vault PIN",
  "derived encryption keys",
  "decrypted highly-sensitive health payloads",
  "raw private sensitive notes",
  "raw medication/allergy/symptom records in Google Sheets",
  "raw child health timeline in Google Sheets",
  "device/control secrets in Drive or Sheets"
]) {
  assert.ok(budget.forbiddenRemoteData.includes(required),required);
}

assert.match(backup,/transport\/storage cho artifact đã mã hóa client-side/);
assert.match(backup,/Không được upload PIN, derived key, plaintext health record/);
assert.match(release,/operational-sovereignty pillar/);
assert.match(release,/AI is advisory only/);

console.log(JSON.stringify({
  ok:true,
  policy:adoption.policyVersion,
  level:budget.blueprintLevel,
  encryptedCloudBackup:true,
  googleSheetsSensitiveData:false
}));
