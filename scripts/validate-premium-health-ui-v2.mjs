import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const hero = fs.readFileSync("app/suc-khoe-tre/premium-health-hero-art.tsx", "utf8");
const profiles = fs.readFileSync("app/suc-khoe-tre/profile-switcher.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/premium-health-ui-v2.css", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Premium Health UI V2 thiếu ${label}: ${token}`);
}

for (const token of [
  'import PremiumHealthHeroArt from "./premium-health-hero-art"',
  '<PremiumHealthHeroArt />',
  '<PremiumQuickActions onNavigate={(target) => setActive(target)} />',
]) need(framework, token, "runtime integration");

need(page, 'import "./premium-health-ui-v2.css"', "V2 stylesheet load order");

for (const token of [
  'className="premium-hero-art"',
  'className="premium-hero-mantra"',
  'Khỏe mạnh',
  'Tự tin · Tỏa sáng',
]) need(hero, token, "hero illustration");

for (const token of [
  'className="profile-avatar"',
  'className="profile-copy"',
  'aria-pressed={selected}',
  'Chưa nhập ngày sinh',
]) need(profiles, token, "profile strip UX");

for (const token of [
  ".premium-hero-art",
  ".profile-switcher{position:relative",
  ".premium-quick-action:hover",
  ".premium-quick-action:active",
  ".hf-primary:active",
  "@media(max-width:1180px)",
  "@media(max-width:880px)",
  "@media(max-width:620px)",
  "@media(prefers-reduced-motion:reduce)",
]) need(styles, token, "responsive/3D visual contract");

if (/\bfetch\s*\(/.test(hero + profiles)) throw new Error("Premium UI V2 không được thêm network/API call");
if (/\/api\/control|CONTROL_SERVICE_SECRET|HEALTH_CONTROL_SERVICE_SECRET/i.test(hero + profiles)) throw new Error("Premium UI V2 không được phụ thuộc Control Plane");
if (/localStorage\.|sessionStorage\./.test(hero)) throw new Error("Hero UI không được chạm dữ liệu local");

console.log("Premium Health UI V2 PASS: illustrated hero, floating profile strip, 3D quick actions, responsive glass dashboard and Control Plane boundary are preserved.");