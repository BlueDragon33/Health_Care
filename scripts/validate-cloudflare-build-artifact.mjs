import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REDIRECT = path.join(ROOT, ".wrangler", "deploy", "config.json");
const LOCAL_D1_ID = "00000000-0000-0000-0000-000000000004";

function fail(message) { throw new Error(message); }
function env(name, required = false) {
  const value = String(process.env[name] ?? "").trim();
  if (required && !value) fail(`${name} is required.`);
  return value;
}
function readJson(file, label) {
  if (!fs.existsSync(file)) fail(`${label} missing: ${path.relative(ROOT, file)}`);
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { fail(`${label} invalid JSON: ${error instanceof Error ? error.message : String(error)}`); }
}
function insideRoot(file, label) {
  const relative = path.relative(ROOT, file);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) fail(`${label} must resolve inside repository.`);
  return relative.split(path.sep).join("/");
}

const expectedPreviewId = env("HEALTH_PREVIEW_D1_DATABASE_ID", true).toLowerCase();
const productionId = env("HEALTH_PRODUCTION_D1_DATABASE_ID").toLowerCase();
if (expectedPreviewId === LOCAL_D1_ID) fail("Preview D1 must not use Health local-only D1 identity.");
if (productionId && expectedPreviewId === productionId) fail("Preview D1 must not reuse Health production D1.");

const redirect = readJson(REDIRECT, "Wrangler generated-config redirect");
if (typeof redirect?.configPath !== "string" || !redirect.configPath.trim()) fail(".wrangler/deploy/config.json must contain configPath.");
const generatedPath = path.resolve(path.dirname(REDIRECT), redirect.configPath);
const generatedRelative = insideRoot(generatedPath, "Generated Wrangler config");
if (!generatedRelative.startsWith("dist/")) fail(`Generated Wrangler config must live under dist/, got ${generatedRelative}.`);
const generated = readJson(generatedPath, "Generated Wrangler config");

if (generated.name !== "health-care-preview") fail(`Unexpected Worker name: ${String(generated.name)}.`);
const db = (Array.isArray(generated.d1_databases) ? generated.d1_databases : []).find((item) => item?.binding === "DB");
if (!db) fail("Generated config missing DB binding.");
if (db.database_name !== "health-care-preview-db") fail("Generated config uses wrong Health preview database name.");
if (String(db.database_id ?? "").toLowerCase() !== expectedPreviewId) fail("Generated config D1 ID does not match HEALTH_PREVIEW_D1_DATABASE_ID.");
if (String(db.database_id ?? "").toLowerCase() === LOCAL_D1_ID) fail("Generated config references Health local-only D1.");
if (productionId && String(db.database_id ?? "").toLowerCase() === productionId) fail("Generated config references Health production D1.");

const vars = generated.vars ?? {};
if (vars.HEALTH_DEPLOYMENT_CHANNEL !== "cloudflare-preview") fail("Generated config deployment channel is not cloudflare-preview.");
if (!/^[A-Za-z0-9._-]{7,80}$/.test(String(vars.HEALTH_BUILD_REVISION ?? ""))) fail("Generated config is missing a valid Health build revision.");
if (generated.assets?.binding !== "ASSETS") fail("Generated config missing ASSETS binding.");
if (generated.images?.binding !== "IMAGES") fail("Generated config missing IMAGES binding.");

console.log("Health generated Cloudflare deployment artifact PASS.");
console.log(`Redirect: .wrangler/deploy/config.json -> ${generatedRelative}`);
console.log(`Worker: ${generated.name}`);
console.log(`D1: ${db.database_name}`);
