import fs from "node:fs";

const trend = fs.readFileSync("app/suc-khoe-tre/growth-trend.tsx", "utf8");

function need(token, label) {
  if (!trend.includes(token)) throw new Error(`Growth V15 thiếu ${label}: ${token}`);
}

for (const [token, label] of [
  ['completedAgeMonths(profile.birthDate, todayKey())', "tuổi hiện tại theo tháng"],
  ['currentAgeMonths >= 108 && currentAgeMonths <= 227', "phạm vi BMI đã kiểm định"],
  ['currentAgeMonths < 24 ? "Chiều dài" : "Chiều cao"', "nhãn chiều dài dưới 2 tuổi"],
  ['...(bmiMetricAllowed ? [{ id: "bmi-z" as const, label: "BMI-for-age WHO" }] : [])', "ẩn BMI ngoài phạm vi"],
  ['!bmiMetricAllowed && metric === "bmi-z" ? "height" : metric', "fallback metric khi đổi hồ sơ"],
  ['metricOptions.map((option)', "render lựa chọn động"],
  ['Nhóm 5–8 tuổi hiện chỉ hiển thị số đo thô', "giải thích khoảng trống 5–8"],
  ['Hồ sơ dưới 2 tuổi ưu tiên xu hướng chiều dài nằm và cân nặng', "giải thích trẻ nhỏ"],
  ['Biểu đồ đang ở chế độ số đo thô theo tuổi.', "trạng thái biểu đồ raw-only"],
  ['metricTitle(effectiveMetric, statureTerm)', "tiêu đề theo tuổi"],
]) need(token, label);

if (trend.includes('const METRIC_OPTIONS:')) throw new Error("Growth V15 không được giữ danh sách metric tĩnh làm BMI xuất hiện cho mọi tuổi");
if (/\bfetch\s*\(/.test(trend)) throw new Error("GrowthTrend không được gọi network trực tiếp");
for (const forbidden of ["/api/control", "CONTROL_SERVICE_SECRET", "diagnose(", "recommendTreatment", "calculateDose", "healthScore"]) {
  if (trend.includes(forbidden)) throw new Error(`GrowthTrend không được chứa control/clinical generation: ${forbidden}`);
}

console.log("Growth V15 PASS: chart controls follow current age; infant uses length wording; BMI option only appears for verified 9y–18y11m scope; no control-plane leakage.");
