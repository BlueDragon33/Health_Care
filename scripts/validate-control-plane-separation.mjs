import { readFile } from "node:fs/promises";

const controlAuthPath = new URL("../app/control-auth.server.ts", import.meta.url);
const wranglerPath = new URL("../wrangler.d1.jsonc", import.meta.url);
const deployPath = new URL("../.github/workflows/deploy.yml", import.meta.url);

const [controlAuth, wrangler, deploy] = await Promise.all([
  readFile(controlAuthPath, "utf8"),
  readFile(wranglerPath, "utf8"),
  readFile(deployPath, "utf8"),
]);

const requiredControlMarkers = [
  "HEALTH_CONTROL_SERVICE_SECRET",
  "child-health-control",
  'app !== "child-health"',
  'https://learning-management.boiech-ai.workers.dev',
  "HEALTH_CONTROL_SECRET_UNCONFIGURED",
];

for (const marker of requiredControlMarkers) {
  if (!controlAuth.includes(marker)) {
    throw new Error(`Control-plane separation gate failed: missing ${marker}`);
  }
}

const forbiddenControlPatterns = [
  /values\.CONTROL_SERVICE_SECRET/,
  /legacy-global/,
  /from\s+["'][^"']*(?:BOIECH_AI|Application-Management|boi-ech|quan-ly-hoc-tap)/i,
  /require\([^)]*(?:BOIECH_AI|Application-Management|boi-ech|quan-ly-hoc-tap)/i,
];

for (const pattern of forbiddenControlPatterns) {
  if (pattern.test(controlAuth)) {
    throw new Error(`Control-plane separation gate failed: forbidden pattern ${pattern}`);
  }
}

if (!/"name"\s*:\s*"suc-khoe-tre"/.test(wrangler)) {
  throw new Error("Health Worker must keep the standalone suc-khoe-tre identity.");
}
if (!/"database_name"\s*:\s*"suc-khoe-tre-db"/.test(wrangler)) {
  throw new Error("Health_Care must use the dedicated suc-khoe-tre-db database.");
}
if (/boi[-_]?ech/i.test(wrangler) || /application[-_]?management/i.test(wrangler)) {
  throw new Error("Health_Care Wrangler configuration must not bind a BOIECH/Admin runtime or database.");
}

if (!deploy.includes("d1 migrations apply suc-khoe-tre-db")) {
  throw new Error("Deployment must migrate the dedicated Health_Care D1 database.");
}
if (!deploy.includes("wrangler deploy --name suc-khoe-tre")) {
  throw new Error("Deployment must target the standalone Health_Care Worker.");
}

console.log("Health_Care control-plane separation: OK");
