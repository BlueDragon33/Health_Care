import fs from "node:fs";

const summary = fs.readFileSync("app/suc-khoe-tre/weekly-health-summary.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/weekly-health-summary.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");

for (const token of [
  'WeeklyHealthMode = "nutrition" | "activity" | "care"',
  "recentDateKeys(7, endDate)",
  "Ngày không ghi không được xem là",
  "không chuyển thành calo",
  "Chưa tự gắn nhãn",
  "Không tính calo",
  "không phải mức khuyến nghị",
]) {
  if (!summary.includes(token)) throw new Error(`Weekly summary thiếu safety contract: ${token}`);
}

for (const mode of ["nutrition", "activity", "care"]) {
  if (!framework.includes(`<WeeklyHealthSummary state={state} endDate={dayKey} mode="${mode}" />`)) {
    throw new Error(`Health framework chưa tích hợp weekly summary: ${mode}`);
  }
}

if (!framework.includes('import WeeklyHealthSummary from "./weekly-health-summary"')) {
  throw new Error("Health framework thiếu import WeeklyHealthSummary");
}
if (!page.includes('import "./weekly-health-summary.css"')) {
  throw new Error("Health page chưa nạp weekly summary CSS");
}
if (!styles.includes("weekly-summary-metrics") || !styles.includes("weekly-day-bars")) {
  throw new Error("Weekly summary CSS thiếu cấu trúc responsive chính");
}
if (!styles.includes("@media (max-width: 520px)")) {
  throw new Error("Weekly summary chưa có mobile breakpoint");
}

console.log("Weekly health summary PASS: nutrition/activity/care 7-day views are descriptive, local-first and non-diagnostic.");
