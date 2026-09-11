import { readFile } from "node:fs/promises";

const controlAuthPath = new URL("../app/control-auth.server.ts", import.meta.url);
const editorAuthPath = new URL("../app/chatgpt-auth.ts", import.meta.url);
const editorBridgePath = new URL("../app/editor-bridge/page.tsx", import.meta.url);
const editorLoginPath = new URL("../app/editor-login-required/page.tsx", import.meta.url);
const editorWorkspacePath = new URL("../app/bien-tap-suc-khoe-tre/workspace.tsx", import.meta.url);
const editorDeviceAuthPath = new URL("../app/editor-device-auth.server.ts", import.meta.url);
const wranglerPath = new URL("../wrangler.d1.jsonc", import.meta.url);
const previewWranglerPath = new URL("../wrangler.cloudflare.preview.example.jsonc", import.meta.url);
const deployPath = new URL("../.github/workflows/deploy.yml", import.meta.url);

const [controlAuth, editorAuth, editorBridge, editorLogin, editorWorkspace, editorDeviceAuth, wrangler, previewWrangler, deploy] = await Promise.all([
  readFile(controlAuthPath, "utf8"),
  readFile(editorAuthPath, "utf8"),
  readFile(editorBridgePath, "utf8"),
  readFile(editorLoginPath, "utf8"),
  readFile(editorWorkspacePath, "utf8"),
  readFile(editorDeviceAuthPath, "utf8"),
  readFile(wranglerPath, "utf8"),
  readFile(previewWranglerPath, "utf8"),
  readFile(deployPath, "utf8"),
]);

const requiredControlMarkers = [
  "HEALTH_CONTROL_SERVICE_SECRET",
  'const TOKEN_ISSUER = "application-management"',
  'const TOKEN_AUDIENCE = "health-care-control"',
  'const TOKEN_APP = "health-care"',
  "HEALTH_CONTROL_SECRET_UNCONFIGURED",
  "APPLICATION_MANAGEMENT_ORIGIN",
  "LOCAL_CONTROL_PLANE",
  "normalizedControlOrigin",
  "trustedControlOrigin",
  "CONTROL_ORIGIN_FORBIDDEN",
];

for (const marker of requiredControlMarkers) {
  if (!controlAuth.includes(marker)) {
    throw new Error(`Control-plane separation gate failed: missing ${marker}`);
  }
}

if (/chatgpt\.site/i.test(controlAuth)) {
  throw new Error("Health control CORS must not retain a ChatGPT Sites origin fallback.");
}
if (!previewWrangler.includes('"APPLICATION_MANAGEMENT_ORIGIN": "__APPLICATION_MANAGEMENT_PREVIEW_ORIGIN__"')) {
  throw new Error("Health preview must materialize the exact Application Management origin.");
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
if (/learning-management\.boiech-ai\.workers\.dev/i.test(editorLogin)) {
  throw new Error("Editor login guidance must not point back to the legacy shared admin URL.");
}
if (!editorWorkspace.includes("health-care-editor:") || !editorDeviceAuth.includes("health-care-editor:")) {
  throw new Error("Editor P-256 proof must use the Health_Care cryptographic domain on both client and server.");
}
if (/boi-ech-editor:/i.test(editorWorkspace) || /boi-ech-editor:/i.test(editorDeviceAuth)) {
  throw new Error("Health_Care editor must not reuse the Boi Ech cryptographic domain.");
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
  throw new Error("Health_Care must keep its dedicated production suc-khoe-tre-db binding during migration.");
}
if (/boi[-_]?ech/i.test(wrangler) || /application[-_]?management/i.test(wrangler)) {
  throw new Error("Health_Care runtime configuration must not bind a BOIECH/Admin database or runtime.");
}
if (!/"database_name"\s*:\s*"health-care-preview-db"/.test(previewWrangler)) {
  throw new Error("Cloudflare preview must use its own health-care-preview-db binding.");
}
if (/6bb920e1-c4dc-4f15-96d5-07516490959b/.test(previewWrangler)) {
  throw new Error("Cloudflare preview must not carry the Health production D1 ID.");
}

if (!/workflow_dispatch\s*:/.test(deploy)) {
  throw new Error("Cloudflare preview deployment must remain explicit/manual only.");
}
if (/\n\s*push\s*:/.test(deploy)) {
  throw new Error("Health_Care preview must not auto-deploy on main pushes before production gate approval.");
}
if (!deploy.includes("Health Cloudflare Preview Deploy") || !deploy.includes("DEPLOY_PREVIEW")) {
  throw new Error("Cloudflare preview workflow must be clearly identified and require explicit confirmation.");
}
if (!deploy.includes("health-care-preview-db --remote") || deploy.includes("suc-khoe-tre-db --remote")) {
  throw new Error("Cloudflare preview workflow must migrate only the preview D1 database.");
}

console.log("Health_Care control-plane separation: exact Application Management origin, isolated preview DB, manual-only deploy.");
