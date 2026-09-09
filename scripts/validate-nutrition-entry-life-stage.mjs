import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const entrySource = fs.readFileSync("app/suc-khoe-tre/nutrition-entry-life-stage.ts", "utf8");
const store = fs.readFileSync("app/suc-khoe-tre/health-local-store.ts", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`V12 nutrition entry thiếu ${label}: ${token}`);
}

for (const token of [
  'NUTRITION_ENTRY_LIFE_STAGE_PLANS',
  '"infant-9-11m"',
  '"toddler-12-23m"',
  '"early-childhood-2-5y"',
  '"school-age-6-8y"',
  'foundation:',
  'preteen:',
  '"early-adolescent":',
  '"late-adolescent":',
  '{ value: "breakfast", label: "Ăn bổ sung · lần 1"',
  '{ value: "lunch", label: "Ăn bổ sung · lần 2"',
  '{ value: "snack", label: "Ăn thêm / bữa phụ"',
  '{ value: "dinner", label: "Ăn bổ sung · lần 3/4"',
  'showWaterCupTracker: false',
  'Không dùng bộ đếm cốc nước cho 9–11 tháng',
  'nutritionEntryPlanForLifeStage',
  'mealSlotLabel',
]) need(entrySource, token, "8 life-stage entry plans");

for (const token of [
  'meal: "breakfast" | "lunch" | "snack" | "dinner"',
  'waterCups: number',
  '["breakfast", "lunch", "snack", "dinner"]',
]) need(store, token, "storage compatibility");

for (const forbidden of [
  "/api/control",
  "CONTROL_SERVICE_SECRET",
  "diagnose(",
  "recommendTreatment",
  "calculateDose",
  "healthScore",
  "weightLossScore",
]) {
  if (entrySource.includes(forbidden)) throw new Error(`V12 nutrition entry không được chứa control/clinical scoring: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(entrySource)) throw new Error("V12 nutrition entry không được gọi network trực tiếp");

for (const token of [
  'import { mealSlotLabel, nutritionEntryPlanForLifeStage } from "./nutrition-entry-life-stage"',
  'const nutritionEntryPlan = useMemo(() => nutritionEntryPlanForLifeStage(profileAge.lifeStage)',
  'nutritionEntryPlan.showWaterCupTracker ?',
  'nutritionEntryPlan.fluidTitle',
  'nutritionEntryPlan.fluidHeading',
  'nutritionEntryPlan.fluidNote',
  'nutritionEntryPlan.mealOptions.map((item)',
  'placeholder={nutritionEntryPlan.mealPlaceholder}',
  'mealSlotLabel(nutritionEntryPlan, entry.meal)',
]) need(framework, token, "runtime integration");

if (framework.includes('<option value="breakfast">Bữa sáng</option><option value="lunch">Bữa trưa</option>')) {
  throw new Error("V12 không được quay lại select bữa ăn hard-coded dùng chung cho mọi tuổi");
}

console.log("Nutrition Entry V12 PASS: meal labels and fluid controls follow all 8 life stages, infant cup-water target UI is suppressed, and stored meal/water schemas remain backward compatible.");
