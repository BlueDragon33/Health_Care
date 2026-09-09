import fs from "node:fs";

const ageScope = fs.readFileSync("app/suc-khoe-tre/health-age-scope.ts", "utf8");
const center = fs.readFileSync("app/suc-khoe-tre/age-content-center.tsx", "utf8");
const early = fs.readFileSync("app/suc-khoe-tre/early-childhood-guide.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/age-content-center.css", "utf8");
const client = fs.readFileSync("app/suc-khoe-tre/health-client.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const manifest = fs.readFileSync("public/manifest.webmanifest", "utf8");
const layout = fs.readFileSync("app/layout.tsx", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Restore 9m–18y thiếu ${label}: ${token}`);
}

for (const token of [
  '"infant-9-11m"',
  '"toddler-12-23m"',
  '"early-childhood-2-5y"',
  '"school-age-6-8y"',
  'minMonths: 9',
  'maxMonths: 227',
  'continuousProductScopeMonths: [9, 227]',
  'earlyChildhoodRestored: true',
]) need(ageScope, token, "phạm vi tuổi liên tục");

for (const token of [
  '9 tháng → 18 tuổi · một lộ trình liên tục',
  'role="tablist"',
  'aria-selected={selectedId === stage.id}',
  'className={selectedId === stage.id ? "is-active" : ""}',
  '<EarlyChildhoodGuide',
]) need(center, token, "active stage selector");

for (const token of [
  'Khôi phục nội dung gốc · 9 tháng → 5 tuổi',
  '"overview"',
  '"nutrition"',
  '"sleep"',
  '"development"',
  '"illness"',
  '"safety"',
  '"sex-care"',
  '9 tháng',
  '12 tháng',
  '18 tháng',
  '2 tuổi',
  '3 tuổi',
  '4 tuổi',
  '5 tuổi',
  'aria-selected={topic === item.id}',
  'aria-selected={milestone === item.months}',
  'aria-selected={viewSex === "male"}',
  'aria-selected={viewSex === "female"}',
  'className={topic === item.id ? "is-active" : ""}',
  'className={milestone === item.months ? "is-active" : ""}',
]) need(early, token, "nội dung trẻ nhỏ / trạng thái chọn");

for (const forbidden of [
  "/api/control",
  "CONTROL_SERVICE_SECRET",
  "diagnose(",
  "calculateDose",
  "recommendTreatment",
  "aria-pressed=",
]) {
  if (early.includes(forbidden) || center.includes(forbidden)) throw new Error(`Nội dung theo tuổi không được chứa control/clinical generation/a11y conflict: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(early) || /\bfetch\s*\(/.test(center)) throw new Error("Age content không được gọi network trực tiếp");

for (const token of [
  'box-shadow:0 5px 0',
  'transform:translateY(3px)',
  '.is-active',
  ':focus-visible',
  '@media(max-width:520px)',
  '@media(prefers-reduced-motion:reduce)',
]) need(styles, token, "3D/active/accessibility style");

need(client, 'import AgeContentCenter from "./age-content-center"', "runtime integration");
need(client, '<AgeContentCenter />', "runtime rendering");
need(page, 'import "./age-content-center.css"', "stylesheet integration");
need(manifest, 'Sức khỏe Y tế · 9 tháng–18 tuổi', "PWA name");
need(layout, 'Sức khỏe Y tế · 9 tháng–18 tuổi', "metadata");

console.log("Restore 9m–18y PASS: continuous age scope, restored 9m–5y guide, active 3D selection controls, profile-aware age center, no control-plane leakage.");
