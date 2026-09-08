import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const quick = fs.readFileSync("app/suc-khoe-tre/premium-quick-actions.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/premium-health-ui.css", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Premium Health UI V1 thiếu ${label}: ${token}`);
}

for (const token of [
  'import PremiumQuickActions from "./premium-quick-actions"',
  'Health Care · Vì một thế hệ khỏe mạnh hơn',
  'Những thói quen nhỏ hôm nay tạo nên một phiên bản khỏe mạnh hơn của ngày mai.',
  '<PremiumQuickActions onNavigate={(target) => setActive(target)} />',
]) need(framework, token, "dashboard integration");

for (const token of [
  '"nutrition" | "activity" | "care" | "journal" | "growth" | "profile"',
  'title: "Ghi bữa ăn"',
  'title: "Ghi vận động"',
  'title: "Ghi giấc ngủ"',
  'title: "Ghi triệu chứng"',
  'title: "Ghi chiều cao / cân nặng"',
  'title: "Thêm nhắc nhở"',
  'aria-label="Thao tác nhanh"',
]) need(quick, token, "six quick actions");

for (const token of [
  ".hf-sidebar{",
  ".hf-topbar{",
  ".hf-topbar::before{",
  ".hf-topbar::after{",
  ".profile-switcher{",
  ".premium-quick-actions{",
  "grid-template-columns:repeat(6,minmax(0,1fr))",
  ".premium-quick-action:active",
  ".premium-quick-action:focus-visible",
  "backdrop-filter:blur",
  "@media(max-width:900px)",
  "@media(max-width:640px)",
  "@media(prefers-reduced-motion:reduce)",
]) need(styles, token, "premium responsive/3D/accessibility style");

need(page, 'import "./premium-health-ui.css";', "theme import");
const imports = [...page.matchAll(/import\s+"\.\/(.+?\.css)";/g)].map((match) => match[1]);
if (imports.at(-1) !== "premium-health-ui.css") throw new Error("Premium theme phải được import cuối để override visual layer mà không sửa business logic");

if (/\bfetch\s*\(/.test(quick) || /\/api\/control|CONTROL_SERVICE_SECRET|healthData/i.test(quick)) {
  throw new Error("Quick Actions chỉ được điều hướng UI, không được gọi Control Plane hoặc xử lý dữ liệu sức khỏe");
}

if (!styles.includes(".hf-bottom-nav{display:grid}")) throw new Error("Mobile phải giữ bottom navigation khi sidebar ẩn");

console.log("Premium Health UI V1 PASS: scenic hero, glass profile strip, six quick actions, premium card system, 3D states, responsive mobile navigation and reduced-motion support are wired without changing health/control-plane boundaries.");
