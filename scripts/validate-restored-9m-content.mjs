import fs from "node:fs";

const ageScope = fs.readFileSync("app/suc-khoe-tre/health-age-scope.ts", "utf8");
const center = fs.readFileSync("app/suc-khoe-tre/age-content-center.tsx", "utf8");
const early = fs.readFileSync("app/suc-khoe-tre/early-childhood-guide.tsx", "utf8");
const stageGuide = fs.readFileSync("app/suc-khoe-tre/stage-health-guide.tsx", "utf8");
const nutrition = fs.readFileSync("app/suc-khoe-tre/nutrition-stage-panel.tsx", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/age-content-center.css", "utf8");
const stageStyles = fs.readFileSync("app/suc-khoe-tre/stage-health-guide.css", "utf8");
const evidence = fs.readFileSync("app/suc-khoe-tre/health-evidence.ts", "utf8");
const client = fs.readFileSync("app/suc-khoe-tre/health-client.tsx", "utf8");
const todayDashboard = fs.readFileSync("app/suc-khoe-tre/attention-queue.tsx", "utf8");
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
  '<StageHealthGuide',
]) need(center, token, "active stage selector");

for (const token of [
  'Nội dung khôi phục & nâng cấp · 9 tháng → 5 tuổi',
  '"overview"',
  '"nutrition"',
  '"sleep"',
  '"movement"',
  '"oral"',
  '"development"',
  '"illness"',
  '"safety"',
  '"sex-care"',
  '3–4 bữa/ngày',
  '180 phút',
  '≥50 lần/phút',
  '≥40 lần/phút',
  'hạt gạo',
  'hạt đậu',
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

for (const token of [
  '"school-age-6-8y"',
  'foundation:',
  'preteen:',
  '"early-adolescent"',
  '"late-adolescent"',
  '"daily"',
  '"nutrition"',
  '"sleep"',
  '"movement"',
  '"school-digital"',
  '"mental-social"',
  '"prevention"',
  '9–12 giờ/24 giờ',
  '8–10 giờ/24 giờ',
  '60 phút/ngày',
  'aria-selected={topic === item.id}',
  'className={topic === item.id ? "is-active" : ""}',
  'noHealthScore: true',
  'noWeightLossGamification: true',
  'noGeneratedDiagnosis: true',
]) need(stageGuide, token, "nội dung 6–18 / active topic");

for (const token of [
  '"infant-9-11m":',
  '"toddler-12-23m":',
  '"early-childhood-2-5y":',
  '"school-age-6-8y":',
  '9–11 tháng · Ăn bổ sung an toàn, tăng dần độ thô',
  'Không dùng mật ong trước 12 tháng',
  'WHO Guideline for complementary feeding of infants and young children 6–23 months (2023)',
]) need(nutrition, token, "dinh dưỡng chuyên dụng trẻ nhỏ");

for (const token of [
  'type HealthLifeStage',
  'function StagePanel({ stage }: { stage: HealthLifeStage | null })',
  '<NutritionStagePanel stage={profileAge.lifeStage} day={day} />',
  '<StagePanel stage={profileAge.lifeStage} />',
  'nội dung được cá nhân hóa liên tục theo 8 giai đoạn từ 9 tháng đến hết 18 tuổi',
]) need(framework, token, "runtime life-stage 9m–18y");
if (framework.includes('<NutritionStagePanel stage={profileAge.stage} day={day} />')) {
  throw new Error("Dedicated Nutrition không được quay lại stage 9–18 và bỏ rơi trẻ dưới 9 tuổi");
}
if (framework.includes('<StagePanel stage={profileAge.stage} />')) {
  throw new Error("Các tab ngày không được hiển thị stage 9–18 cho hồ sơ trẻ nhỏ");
}

for (const forbidden of [
  "/api/control",
  "CONTROL_SERVICE_SECRET",
  "diagnose(",
  "calculateDose",
  "recommendTreatment",
  "aria-pressed=",
]) {
  for (const source of [early, center, stageGuide]) {
    if (source.includes(forbidden)) throw new Error(`Nội dung theo tuổi không được chứa control/clinical generation/a11y conflict: ${forbidden}`);
  }
}
for (const source of [early, center, stageGuide]) {
  if (/\bfetch\s*\(/.test(source)) throw new Error("Age content không được gọi network trực tiếp");
}

for (const token of [
  'box-shadow:0 5px 0',
  'transform:translateY(3px)',
  '.is-active',
  ':focus-visible',
  '@media(max-width:520px)',
  '@media(prefers-reduced-motion:reduce)',
]) need(styles, token, "3D/active/accessibility style");
for (const token of ['box-shadow:0 5px 0', 'transform:translateY(3px)', '.is-active', ':focus-visible', '@media(prefers-reduced-motion:reduce)']) need(stageStyles, token, "3D topic style");

for (const token of [
  'whoChildGrowthStandards',
  'whoComplementaryFeeding2023',
  'whoImciChild',
  'whoHealthyDiet2026',
  'whoPhysicalActivity',
  'aasmChildSleep',
  'aapdFluorideOralCare',
  'cdcDevelopmentalMilestones',
  'cdcChokingPrevention',
]) need(evidence, token, "evidence registry 9m–18y");

/* AgeContentCenter used to render above the entire app. V5 intentionally nests it in the Today dashboard so the first screen matches the product dashboard while preserving runtime access to all age content. */
need(client, '<HealthFramework initialCourse={initialCourse} device={device} />', "canonical Health runtime");
need(todayDashboard, 'import AgeContentCenter from "./age-content-center"', "age content runtime integration");
need(todayDashboard, '<AgeContentCenter ageMonths={age.months} sex={state.profile.sex} />', "age content runtime rendering");
need(todayDashboard, 'Từ 9 tháng đến hết 18 tuổi', "visible 9-month product scope");
need(todayDashboard, '9–11 tháng', "visible infant stage");
need(page, 'import "./age-content-center.css"', "stylesheet integration");
need(page, 'import "./stage-health-guide.css"', "topic stylesheet integration");
need(page, 'import "./reference-dashboard-v5.css"', "Today dashboard v5 styles");
need(manifest, 'Sức khỏe Y tế · 9 tháng–18 tuổi', "PWA name");
need(layout, 'Sức khỏe Y tế · 9 tháng–18 tuổi', "metadata");

console.log("Restore 9m–18y V3 PASS: continuous age scope, dedicated 9m nutrition runtime, enriched early-child guide, active 6–18 guides, evidence registry and no control-plane leakage.");
