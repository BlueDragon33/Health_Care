import fs from "node:fs";

const required = [
  "wrangler.cloudflare.preview.example.jsonc",
  "scripts/prepare-cloudflare-preview.mjs",
  ".github/workflows/deploy.yml",
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Thiếu Cloudflare preview scaffold: ${file}`);
}

const template = fs.readFileSync("wrangler.cloudflare.preview.example.jsonc", "utf8");
const workflow = fs.readFileSync(".github/workflows/deploy.yml", "utf8");
const prepare = fs.readFileSync("scripts/prepare-cloudflare-preview.mjs", "utf8");
const vite = fs.readFileSync("vite.config.ts", "utf8");
const contract = fs.readFileSync("app/health-management-contract.ts", "utf8");

for (const token of [
  '"name": "health-care-preview"',
  '"binding": "DB"',
  '"database_name": "health-care-preview-db"',
  '"binding": "ASSETS"',
  '"binding": "IMAGES"',
  '__HEALTH_PREVIEW_D1_DATABASE_ID__',
]) {
  if (!template.includes(token)) throw new Error(`Preview template thiếu: ${token}`);
}

if (template.includes("6bb920e1-c4dc-4f15-96d5-07516490959b")) {
  throw new Error("Preview template không được chứa production D1 ID.");
}
if (!prepare.includes("PRODUCTION_D1_ID") || !prepare.includes("Preview tuyệt đối không được dùng D1 production")) {
  throw new Error("Prepare script phải chặn production D1.");
}
if (!prepare.includes(".chatgpt.site")) throw new Error("Prepare script phải chặn fallback về ChatGPT Sites.");
if (!vite.includes("CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH")) throw new Error("Vite config chưa hỗ trợ Cloudflare preview config path.");
if (!contract.includes('transport: "https-worker"') || !contract.includes('primaryTarget: "cloudflare-workers"')) {
  throw new Error("Health management contract chưa phản ánh transport Cloudflare mới.");
}

if (!workflow.includes("workflow_dispatch")) throw new Error("Cloudflare preview deploy phải là manual workflow ở giai đoạn này.");
if (/\npush:\s*(\n|$)/.test(workflow)) throw new Error("Cloudflare preview chưa được phép auto-deploy khi push main.");
if (!workflow.includes("HEALTH_PREVIEW_D1_DATABASE_ID")) throw new Error("Deploy workflow thiếu preview D1 secret.");
if (!workflow.includes("HEALTH_CONTROL_SERVICE_SECRET")) throw new Error("Deploy workflow thiếu Health control secret.");
if (!workflow.includes("wrangler.cloudflare.preview.jsonc")) throw new Error("Deploy workflow phải dùng config preview đã materialize.");
if (!workflow.includes("wrangler d1 migrations apply health-care-preview-db --remote")) throw new Error("Deploy workflow phải migrate đúng preview D1.");
if (!workflow.includes("wrangler deploy")) throw new Error("Deploy workflow chưa có bước deploy Cloudflare Worker.");
if (workflow.includes("suc-khoe-tre-db --remote")) throw new Error("Deploy preview tuyệt đối không được migrate production D1.");

console.log("Health Cloudflare preview scaffold PASS: manual-only, isolated D1, hosting-neutral control contract.");
