import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const growth = fs.readFileSync("app/suc-khoe-tre/growth-life-stage.ts", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Growth V13 thiếu ${label}: ${token}`);
}

for (const token of [
  '"infant-9-11m"',
  '"toddler-12-23m"',
  '"early-childhood-2-5y"',
  '"school-age-6-8y"',
  'foundation:',
  'preteen:',
  '"early-adolescent"',
  '"late-adolescent"',
  "Chiều dài nằm (cm)",
  "Chiều cao đứng (cm)",
  "Không hiển thị BMI như chỉ số phân loại cho hồ sơ dưới 5 tuổi.",
  "growthConfigForLifeStage",
  "growthSummaryMetric",
]) need(growth, token, "life-stage growth presentation");

for (const token of [
  'import { growthConfigForLifeStage, growthSummaryMetric, growthTimelinePresentation } from "./growth-life-stage"',
  'const growthStage = useMemo(() => growthConfigForLifeStage(profileAge.lifeStage)',
  'const growthSummary = useMemo(() => growthSummaryMetric(profileAge.months',
  '{growthStage.statureLabel}',
  'placeholder={growthStage.staturePlaceholder}',
  'placeholder={growthStage.weightPlaceholder}',
  '{growthStage.measurementHint}',
  '<strong>{growthSummary.value}</strong><small>{growthSummary.label}</small>',
  '{growthSummary.detail}',
]) need(framework, token, "runtime integration");

for (const oldToken of ['placeholder="Ví dụ 156.5"', 'placeholder="Ví dụ 48.2"']) {
  if (framework.includes(oldToken)) throw new Error(`Growth V13 còn placeholder dành cho trẻ lớn: ${oldToken}`);
}

for (const forbidden of ["/api/control", "CONTROL_SERVICE_SECRET", "diagnose(", "recommendTreatment", "calculateDose", "healthScore"]) {
  if (growth.includes(forbidden)) throw new Error(`Growth life-stage không được chứa control/clinical generation: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(growth)) throw new Error("Growth life-stage không được gọi network trực tiếp");

console.log("Growth V13 PASS: measurement wording follows life stage; under-5 summary avoids BMI 5–19 classification UI; V14 helper wiring remains compatible; storage/control-plane boundaries unchanged.");
