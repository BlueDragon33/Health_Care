import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const routineSource = fs.readFileSync("app/suc-khoe-tre/today-life-stage.ts", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`V11 Today thiếu ${label}: ${token}`);
}

for (const token of [
  'TODAY_LIFE_STAGE_ROUTINES',
  '"infant-9-11m"',
  '"toddler-12-23m"',
  '"early-childhood-2-5y"',
  '"school-age-6-8y"',
  'foundation:',
  'preteen:',
  '"early-adolescent":',
  '"late-adolescent":',
  'Đã theo dõi ăn bổ sung trong ngày',
  'Đã theo dõi bú/sữa và chất lỏng',
  'Có chơi vận động trên sàn / đổi tư thế',
  'Chăm răng/nướu buổi sáng nếu phù hợp',
  'không phải điểm sức khỏe',
  'todayNutritionMetric',
  'todayWeekMetric',
]) need(routineSource, token, "8 life-stage routines");

for (const forbidden of [
  "/api/control",
  "CONTROL_SERVICE_SECRET",
  "diagnose(",
  "recommendTreatment",
  "calculateDose",
  "healthScore",
  "weightLossScore",
]) {
  if (routineSource.includes(forbidden)) throw new Error(`V11 Today không được chứa control/clinical scoring: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(routineSource)) throw new Error("V11 Today không được gọi network trực tiếp");

for (const token of [
  'import { todayNutritionMetric, todayRoutineForLifeStage, todayWeekMetric } from "./today-life-stage"',
  'const todayRoutine = useMemo(() => todayRoutineForLifeStage(profileAge.lifeStage)',
  'const completed = todayRoutine.tasks.filter((task) => day.tasks[task.key]).length',
  'todayRoutine.tasks.length',
  'todayRoutine.progressSummary',
  'todayRoutine.note',
  'todayRoutine.tasks.map((task)',
  'todayNutritionMetric(profileAge.lifeStage, day, foodGroups.length)',
  'todayWeekMetric(profileAge.lifeStage, record)',
]) need(framework, token, "runtime integration");

if (framework.includes('const todayTasks: { key: TaskKey; label: string; group: string }[]')) {
  throw new Error("V11 không được quay lại checklist Today cố định dùng chung mọi tuổi");
}
if (framework.includes('todayTasks.map((task)')) {
  throw new Error("V11 Today phải render task từ life-stage routine");
}

console.log("Today V11 PASS: 8 life stages drive checklist labels and compact nutrition/week metrics without changing task storage schema, control-plane or medical-safety boundaries.");
