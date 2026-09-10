import fs from "node:fs";

const TEMPLATE = "wrangler.cloudflare.preview.example.jsonc";
const TARGET = "wrangler.cloudflare.preview.jsonc";
const PRODUCTION_D1_ID = "6bb920e1-c4dc-4f15-96d5-07516490959b";

function required(name) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) throw new Error(`${name} chưa được cấu hình.`);
  return value;
}

function optionalHttpsOrigin(name) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} không phải URL hợp lệ.`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${name} phải là HTTPS origin thuần, không có path/query/hash.`);
  }
  if (url.hostname.endsWith(".chatgpt.site")) {
    throw new Error(`${name} không được trỏ về ChatGPT Sites trong deployment Cloudflare mới.`);
  }
  return url.origin;
}

if (!fs.existsSync(TEMPLATE)) throw new Error(`Thiếu ${TEMPLATE}.`);

const d1Id = required("HEALTH_PREVIEW_D1_DATABASE_ID");
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d1Id)) {
  throw new Error("HEALTH_PREVIEW_D1_DATABASE_ID không đúng định dạng UUID D1.");
}
if (d1Id.toLowerCase() === PRODUCTION_D1_ID) {
  throw new Error("Preview tuyệt đối không được dùng D1 production hiện tại của Health_Care.");
}

const applicationManagementOrigin = optionalHttpsOrigin("APPLICATION_MANAGEMENT_PREVIEW_ORIGIN");
const template = fs.readFileSync(TEMPLATE, "utf8");
const rendered = template
  .replace("__HEALTH_PREVIEW_D1_DATABASE_ID__", d1Id)
  .replace("__APPLICATION_MANAGEMENT_PREVIEW_ORIGIN__", applicationManagementOrigin);

if (/__[A-Z0-9_]+__/.test(rendered)) throw new Error("Cloudflare preview config vẫn còn placeholder.");
fs.writeFileSync(TARGET, rendered, { mode: 0o600 });

console.log(`Prepared ${TARGET} with isolated preview D1.`);
console.log(applicationManagementOrigin
  ? `Application Management preview origin: ${applicationManagementOrigin}`
  : "Application Management preview origin chưa có; Health preview sẽ fail-closed cho browser control CORS cho tới lần redeploy sau.");
