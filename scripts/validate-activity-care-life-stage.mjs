import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const lifeStageModule = fs.readFileSync("app/suc-khoe-tre/activity-care-stage-panel.tsx", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`V10 activity/care thiếu ${label}: ${token}`);
}

for (const token of [
  '"infant-9-11m"',
  '"toddler-12-23m"',
  '"early-childhood-2-5y"',
  '"school-age-6-8y"',
  'foundation:',
  'preteen:',
  '"early-adolescent":',
  '"late-adolescent":',
  '"Chơi trên sàn"',
  '"Bò / trườn"',
  '"Đi bộ / tập đi"',
  '"Chơi ngoài trời"',
  '"Thể thao đồng đội"',
  'activityOptionsForLifeStage',
  'shouldShowEyeBreakTracker',
  'data-activity-life-stage',
  'data-care-life-stage',
  'Không dùng mục tiêu 60 phút kiểu trẻ lớn',
  '12–16 giờ/24 giờ',
  '11–14 giờ/24 giờ',
  '9–12 giờ ngủ/24 giờ',
  '8–10 giờ ngủ/24 giờ',
  'Không dùng bộ đếm nghỉ mắt kiểu học đường',
]) need(lifeStageModule, token, "8 life-stage guidance");

for (const forbidden of [
  "/api/control",
  "CONTROL_SERVICE_SECRET",
  "diagnose(",
  "recommendTreatment",
  "calculateDose",
  "weightLossScore",
]) {
  if (lifeStageModule.includes(forbidden)) throw new Error(`V10 activity/care không được chứa control/clinical generation: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(lifeStageModule)) throw new Error("V10 activity/care không được gọi network trực tiếp");

for (const token of [
  'import { ActivityStagePanel, CareStagePanel, activityOptionsForLifeStage, shouldShowEyeBreakTracker } from "./activity-care-stage-panel"',
  'const activityOptions = useMemo(() => activityOptionsForLifeStage(profileAge.lifeStage)',
  'const selectedActivityType = activityOptions.includes(activityType) ? activityType : activityOptions[0]',
  'type: selectedActivityType',
  '<ActivityStagePanel stage={profileAge.lifeStage} />',
  '{activityOptions.map((item) => <option key={item}>{item}</option>)}',
  '<CareStagePanel stage={profileAge.lifeStage} />',
  'shouldShowEyeBreakTracker(profileAge.lifeStage)',
  'Không dùng bộ đếm nghỉ mắt cho trẻ nhỏ',
]) need(framework, token, "runtime integration");

if (framework.includes('const activityTypes = ["Đi bộ", "Chạy"')) {
  throw new Error("V10 không được quay lại danh sách activityTypes dùng chung cho mọi tuổi");
}
if (framework.includes('{activityTypes.map((item) => <option key={item}>{item}</option>)}')) {
  throw new Error("V10 select hoạt động phải lấy options theo lifeStage");
}

console.log("Activity/Care V10 PASS: 8 life stages drive activity options and care guidance; school eye-break tracker is not shown to early-childhood profiles; no control-plane or clinical-generation leakage.");
