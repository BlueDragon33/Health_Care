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
const v1Index = imports.indexOf("premium-health-ui.css");
const v2Index = imports.indexOf("premium-health-ui-v2.css");
const referenceIndex = imports.indexOf("reference-dashboard-v4.css");
const referenceV5Index = imports.indexOf("reference-dashboard-v5.css");
const iconsIndex = imports.indexOf("reference-dashboard-icons.css");
if (v1Index < 0) throw new Error("Premium Health UI V1 stylesheet phải được nạp");
if (v2Index >= 0) {
  if (v2Index !== v1Index + 1) {
    throw new Error("Premium UI V1 phải nằm ngay trước V2 để giữ thứ tự refinement");
  }
  if (referenceIndex >= 0) {
    if (referenceIndex !== v2Index + 1) throw new Error("Reference dashboard V4 phải nạp ngay sau V2");
    const expectedIconsIndex = referenceV5Index >= 0 ? referenceV5Index + 1 : referenceIndex + 1;
    if (referenceV5Index >= 0 && referenceV5Index !== referenceIndex + 1) throw new Error("Reference dashboard V5 phải nạp ngay sau V4");
    if (iconsIndex !== expectedIconsIndex || imports.at(-1) !== "reference-dashboard-icons.css") {
      throw new Error("Icon polish phải là stylesheet cuối sau các lớp reference refinement");
    }
  } else if (imports.at(-1) !== "premium-health-ui-v2.css") {
    throw new Error("Khi chưa có reference refinement, V2 phải là stylesheet cuối");
  }
} else if (imports.at(-1) !== "premium-health-ui.css") {
  throw new Error("Premium theme V1 phải được import cuối khi chưa có lớp refinement mới");
}

if (/\bfetch\s*\(/.test(quick) || /\/api\/control|CONTROL_SERVICE_SECRET|healthData/i.test(quick)) {
  throw new Error("Quick Actions chỉ được điều hướng UI, không được gọi Control Plane hoặc xử lý dữ liệu sức khỏe");
}

if (!styles.includes(".hf-bottom-nav{display:grid}")) throw new Error("Mobile phải giữ bottom navigation khi sidebar ẩn");

console.log("Premium Health UI V1/V5 PASS: scenic hero, glass profile strip, six quick actions, ordered reference refinements, 3D states and responsive navigation are wired without changing health/control-plane boundaries.");
