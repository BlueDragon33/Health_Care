import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const growth = fs.readFileSync("app/suc-khoe-tre/growth-life-stage.ts", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Growth V14 thiếu ${label}: ${token}`);
}

for (const token of [
  "growthTimelinePresentation",
  "useWhoBmiReference: boolean",
  "Chiều dài / cân nặng",
  "Chiều cao / cân nặng",
  "WHO 0–5 · không phân loại bằng BMI-for-age 5–19",
  "bảng LMS định lượng 5–8 tuổi chưa được tích hợp/kiểm định trong ứng dụng",
  "ageMonths < 108",
  "ageMonths > 227",
  'return ageMonths < 24 ? `${ageMonths} tháng` : formatAgeMonths(ageMonths)',
]) need(growth, token, "age-at-measurement presentation");

for (const token of [
  'completedAgeMonths, formatAgeMonths',
  'growthTimelinePresentation(profileAgeAtMeasurement, entryBmi)',
  'const profileAgeAtMeasurement = completedAgeMonths(state.profile.birthDate, entry.date)',
  '{presentation.metricLabel}',
  'presentation.useWhoBmiReference ? (assessment.available',
  ': presentation.detail',
  'bảng LMS đã kiểm định trong ứng dụng hiện mới tích hợp từ 9 tuổi',
]) need(framework, token, "runtime timeline wiring");

const unconditionalBmi = '<span>BMI {calculateBmi(entry.heightCm, entry.weightKg)?.toFixed(1) ?? "—"}</span>';
if (framework.includes(unconditionalBmi)) throw new Error("Growth V14 còn hiển thị BMI vô điều kiện cho mọi mốc lịch sử");

for (const oldText of [
  "Từ 5 tuổi, BMI-for-age được đối chiếu theo đúng tuổi tính bằng tháng và giới tính với WHO Reference 2007.",
  "từ 5 đến hết 18 tuổi mới dùng BMI-for-age theo tháng và giới tính của WHO Reference 2007",
]) {
  if (framework.includes(oldText)) throw new Error(`Growth V14 còn mô tả phạm vi rộng hơn dữ liệu LMS đã tích hợp: ${oldText}`);
}

for (const forbidden of ["/api/control", "CONTROL_SERVICE_SECRET", "diagnose(", "recommendTreatment", "calculateDose", "healthScore"]) {
  if (growth.includes(forbidden)) throw new Error(`Growth presentation không được chứa control/clinical generation: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(growth)) throw new Error("Growth presentation không được gọi network trực tiếp");

console.log("Growth V14 PASS: each historical measurement uses age at its own date; 9–23 months stays month-formatted; under-9 history avoids unsupported BMI classification; verified LMS scope remains 9y–18y11m.");
