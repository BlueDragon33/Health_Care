import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Health publishes Universal automation contract without removing the legacy adapter contract", () => {
  const contracts = source("app/health-management-contract.ts");
  const route = source("app/api/application-management/contract/route.ts");
  assert.match(contracts, /HEALTH_MANAGEMENT_CONTRACT/);
  assert.match(contracts, /HEALTH_UNIVERSAL_MANAGEMENT_CONTRACT/);
  assert.match(contracts, /schema: "application-management\.contract\/v1"/);
  assert.match(contracts, /deviceAutoApproval: true/);
  assert.match(contracts, /deviceAutoBlockPending: true/);
  assert.match(contracts, /automationIdempotentCommands: true/);
  assert.match(contracts, /automationOptimisticConcurrency: true/);
  assert.match(contracts, /automation: "\/api\/control\/automation"/);
  assert.match(route, /HEALTH_UNIVERSAL_MANAGEMENT_CONTRACT/);
});

test("Health Universal automation command uses idempotency before CAS and readback", () => {
  const automation = source("app/device-automation.server.ts");
  const priorIndex = automation.indexOf("const prior = await commandRow(database, commandId)");
  const currentIndex = automation.indexOf("const current = await getHealthDeviceAutomationSettings()", priorIndex);
  assert.ok(priorIndex >= 0 && currentIndex > priorIndex);
  assert.match(automation.slice(priorIndex, currentIndex), /replayed: true/);
  assert.match(automation, /WHERE id=1 AND revision=\?/);
  assert.match(automation, /AUTOMATION_STATE_CONFLICT/);
  assert.match(automation, /AUTOMATION_READBACK_MISMATCH/);
  assert.match(automation, /COMMAND_ID_PAYLOAD_MISMATCH/);
});

test("Health automation POST remains backward-compatible for legacy adapter payloads", () => {
  const route = source("app/api/control/automation/route.ts");
  assert.match(route, /payload\.operation === "set-device-automation"/);
  assert.match(route, /executeHealthDeviceAutomationCommand/);
  assert.match(route, /updateHealthDeviceAutomationSettings/);
});
