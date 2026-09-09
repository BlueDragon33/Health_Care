import { readFile } from "node:fs/promises";

const controlAuthPath = new URL("../app/control-auth.server.ts", import.meta.url);
const editorAuthPath = new URL("../app/chatgpt-auth.ts", import.meta.url);
const editorBridgePath = new URL("../app/editor-bridge/page.tsx", import.meta.url);
const editorLoginPath = new URL("../app/editor-login-required/page.tsx", import.meta.url);
const wranglerPath = new URL("../wrangler.d1.jsonc", import.meta.url);
const deployPath = new URL("../.github/workflows/deploy.yml", import.meta.url);

const [controlAuth, editorAuth, editorBridge, editorLogin, wrangler, deploy] = await Promise.all([
  readFile(controlAuthPath, "utf8"),
  readFile(editorAuthPath, "utf8"),
  readFile(editorBridgePath, "utf8"),
  readFile(editorLoginPath, "utf8"),
  readFile(wranglerPath, "utf8"),
  readFile(deployPath, "utf8"),
]);

const requiredControlMarkers = [
  "HEALTH_CONTROL_SERVICE_SECRET",
  'const TOKEN_ISSUER = "application-management"',
  'const TOKEN_AUDIENCE = "health-care-control"',
  'const TOKEN_APP = "health-care"',
  '.chatgpt.site',
  "HEALTH_CONTROL_SECRET_UNCONFIGURED",
];

for (const marker of requiredControlMarkers) {
  if (!controlAuth.includes(marker)) {
    throw new Error(`Control-plane separation gate failed: missing ${marker}`);
  }
}

for (const marker of [
  "HEALTH_CONTROL_SERVICE_SECRET",
  'const CONTROL_ISSUER = "application-management"',
  'const CONTROL_AUDIENCE = "health-care-control"',
  'const CONTROL_APP = "health-care"',
  'const SESSION_ISSUER = "health-care"',
  'const SESSION_AUDIENCE = "health-care-editor"',
]) {
  if (!editorAuth.includes(marker)) {
    throw new Error(`Editor control gate failed: missing ${marker}`);
  }
}

if (!editorBridge.includes('window.location.hash') || !editorBridge.includes('fetch("/api/editor/session"') || !editorBridge.includes('method: "POST"')) {
  throw new Error("Editor bridge must exchange the short-lived ticket from the URL fragment by same-origin POST.");
}
if (/learning-management\.boiech-ai\.workers\.dev|workers\.dev/i.test(editorLogin)) {
  throw new Error("Editor login guidance must not point back to the legacy Cloudflare admin URL.");
}

const forbiddenPatterns = [
  /values\.CONTROL_SERVICE_SECRET/,
  /\.CONTROL_SERVICE_SECRET\b/,
  /legacy-global/,
  /https:\/\/learning-management\.boiech-ai\.workers\.dev/,
];

for (const [name, source] of [["control auth", controlAuth], ["editor auth", editorAuth]]) {
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      throw new Error(`${name} separation gate failed: forbidden pattern ${pattern}`);
    }
  }
}

if (!/"database_name"\s*:\s*"suc-khoe-tre-db"/.test(wrangler)) {
  throw new Error("Health_Care must keep its dedicated suc-khoe-tre-db database binding.");
}
if (/boi[-_]?ech/i.test(wrangler) || /application[-_]?management/i.test(wrangler)) {
  throw new Error("Health_Care runtime configuration must not bind a BOIECH/Admin database or runtime.");
}

if (!/workflow_dispatch\s*:/.test(deploy)) {
  throw new Error("Legacy Cloudflare deployment must remain explicit/manual only.");
}
if (/\n\s*push\s*:/.test(deploy)) {
  throw new Error("Health_Care must not auto-deploy to Cloudflare on main pushes after ChatGPT Sites migration.");
}
if (!deploy.includes("Legacy Cloudflare Deploy (manual only)")) {
  throw new Error("Legacy Cloudflare workflow must be clearly marked manual-only.");
}

console.log("Health_Care ChatGPT Sites control-plane separation: OK");
