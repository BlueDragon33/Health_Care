import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");
const hero = fs.readFileSync("app/suc-khoe-tre/premium-health-hero-art.tsx", "utf8");
const profiles = fs.readFileSync("app/suc-khoe-tre/profile-switcher.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/premium-health-ui-v2.css", "utf8");
const reference = fs.readFileSync("app/suc-khoe-tre/reference-dashboard-v4.css", "utf8");
const icons = fs.readFileSync("app/suc-khoe-tre/reference-dashboard-icons.css", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Premium Health UI thiếu ${label}: ${token}`);
}

for (const token of [
  'import PremiumHealthHeroArt from "./premium-health-hero-art"',
  '<PremiumHealthHeroArt />',
  '<PremiumQuickActions onNavigate={(target) => setActive(target)} />',
]) need(framework, token, "runtime integration");

for (const token of [
  'import "./premium-health-ui-v2.css"',
  'import "./reference-dashboard-v4.css"',
  'import "./reference-dashboard-icons.css"',
]) need(page, token, "stylesheet load order");

for (const token of [
  'className="premium-hero-art"',
  'className="premium-hero-mantra"',
  'Khỏe mạnh',
  'Tự tin',
  'Tỏa sáng',
  'heroLake',
  'heroHair',
]) need(hero, token, "illustrated scenic hero");

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
]) need(styles, token, "existing responsive/3D visual contract");

for (const token of [
  '.hf-layout{grid-template-columns:240px',
  '.hf-nav-item.is-active',
  'background:linear-gradient(135deg,#29a9ff,#2582ff)',
  '.hf-topbar{position:relative',
  '.profile-switcher{position:absolute',
  '.premium-quick-actions{position:relative',
  'grid-template-columns:repeat(6,minmax(0,1fr))',
  '.growth-line{stroke:#278cff',
  '.hf-week-strip{grid-template-columns:repeat(7',
  '@media(max-width:880px)',
  '@media(max-width:620px)',
  '@media(prefers-reduced-motion:reduce)',
]) need(reference, token, "reference dashboard composition");

for (const token of [
  '.hf-nav-item:nth-child(1)',
  '.hf-nav-item:nth-child(7)',
  '.hf-progress-title:before',
  '.hf-quick-card:before',
]) need(icons, token, "reference icon polish");

if (/\bfetch\s*\(/.test(hero + profiles + reference + icons)) throw new Error("Premium UI không được thêm network/API call");
if (/\/api\/control|CONTROL_SERVICE_SECRET|HEALTH_CONTROL_SERVICE_SECRET/i.test(hero + profiles + reference + icons)) throw new Error("Premium UI không được phụ thuộc Control Plane");
if (/localStorage\.|sessionStorage\./.test(hero)) throw new Error("Hero UI không được chạm dữ liệu local");

console.log("Premium Health UI PASS: reference-like blue sidebar, scenic hero, floating profiles, six quick actions, glass dashboard cards, chart styling and responsive behavior are preserved.");
