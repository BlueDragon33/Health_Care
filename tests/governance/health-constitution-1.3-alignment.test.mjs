import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
const json=(p)=>JSON.parse(readFileSync(p,"utf8"));
const text=(p)=>readFileSync(p,"utf8");
const manifest=json(".blueprint/constitution-adoption.json");
const budget=json(".blueprint/dependency-budget.json");
const docBudget=json("docs/DEPENDENCY_BUDGET.json");
const audit=json("docs/CONSTITUTION-1.3-HEALTH-ADOPTION-AUDIT.json");
const policy=text("docs/DEVELOPMENT_RELEASE_POLICY.md");
const preview=text(".github/workflows/deploy.yml");
const live=text(".github/workflows/live-development-deploy.yml");
test("1.3 inheritance matches actual ratified central contract and keeps sensitive B5 authority protected",()=>{
 assert.equal(manifest.schemaVersion,"1.0.0");
 assert.equal(manifest.policyId,"blueprint-os:universal-century-grade");
 assert.equal(manifest.policyVersion,"1.3.0");
 assert.equal(manifest.projectId,"project:health-care");
 assert.equal(manifest.blueprintLevel,"B5");
 assert.equal(manifest.enforcementMode,"enforced");
 assert.equal(manifest.evidenceAuthority,"canonical-quality-gates");
 assert.equal(manifest.productionAuthority,"separate-explicit-release-gate");
 assert.deepEqual(manifest.disabledPillars,[]);
 assert.deepEqual(manifest.constitutionalWaivers,[]);
 const pillars=[
 "structural-capacity","architectural-longevity","product-elegance",
 "premium-usability","long-term-durability","fortress-security-disaster-resilience",
 "operational-sovereignty-dependency-minimization"
 ];
 assert.deepEqual(manifest.inheritedPillars,pillars);
 assert.equal(audit.sourceAuthority.version,manifest.policyVersion);
 assert.equal(audit.sourceAuthority.machineContract,"control/universal-constitution.contract.json");
});
test("source-aligned budgets preserve local private data as canonical, no cosmetic compliance",()=>{
 assert.equal(budget.policyVersion,manifest.policyVersion);
 assert.equal(budget.complianceState,"MIGRATION_REQUIRED");
 assert.equal(budget.posture,"LOCAL_CANONICAL_SENSITIVE_DATA");
 assert(budget.migrationBlockers.length>=3);
 assert.equal(docBudget.constitutionPolicy,manifest.policyId+"@"+manifest.policyVersion);
 assert.equal(docBudget.defaultPrinciple,"LOCAL_CANONICAL_SENSITIVE_DATA_OFFLINE_FIRST_ENCRYPTED_OPTIONAL_SYNC");
 const deps=new Map(docBudget.dependencies.map(d=>[d.id,d]));
 assert.equal(deps.get("secure-local-vault")?.runtimeClass,"LOCAL_CORE");
 assert.equal(deps.get("chatgpt-ai")?.runtimeClass,"OPTIONAL_INTELLIGENCE");
 assert.match(deps.get("google-sheets")?.canonicalState??"",/forbidden/i);
 assert.match(deps.get("google-drive-backup")?.dataBoundary??"",/encrypted backup artifact only/i);
 assert.match(policy,/OFFLINE-FIRST \/ LOCAL-ONLY/);
 assert.doesNotMatch(policy,/main.*auto.publish/i);
});
test("honest adoption audit does not imply production, offline acceptance or new ratification",()=>{
 assert.equal(audit.reviewScope,"SOURCE_LEVEL_CONSTITUTION_INHERITANCE_ONLY");
 assert.equal(audit.truthBoundary.structureAdoptedDoesNotMeanProductAccepted,true);
 assert.equal(audit.truthBoundary.ciSuccessCannotReplaceIndependentReviewer,true);
 assert.equal(audit.truthBoundary.offlineRuntime,"UNVERIFIED");
 assert.equal(audit.truthBoundary.productAcceptance,"UNVERIFIED");
 assert.match(audit.truthBoundary.releaseGate,/BLOCKED/);
 assert.equal(audit.truthBoundary.remotePublish,"DORMANT");
 assert.equal(audit.truthBoundary.priorProductionUrls,"NOT_REVOKED");
 assert(audit.pendingEvidence.length>=4);
 for(const x of audit.verifiedContractSources)assert(existsSync(x),"missing source "+x);
 for(const x of audit.observedImplementationEvidence){
  assert(existsSync(x.code),"missing implementation "+x.code);
  assert(existsSync(x.test),"missing validation "+x.test);
 }
});
test("Cloudflare published Preview and Live are fail-closed even on workflow dispatch",()=>{
 for(const [id,wf] of [["deploy-preview",preview],["deploy_live",live]]){
  const events=wf.slice(wf.indexOf("\non:"),wf.indexOf("\npermissions:"));
  assert.doesNotMatch(events,/\bpush:|\bissue_comment:|\bworkflow_run:/);
  assert.match(wf,new RegExp("^  "+id+":\\n(?:    #[^\\n]*\\n)*    if: \\$\\{\\{ false \\}\\}","m"));
 }
});
