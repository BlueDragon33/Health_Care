import fs from "node:fs";

const timeline = fs.readFileSync("app/suc-khoe-tre/health-timeline.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/health-timeline.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");

for (const token of [
  'HealthTimelineKind = "growth" | "symptom" | "journal" | "care" | "activity" | "nutrition"',
  'TimelineRange = "30d" | "90d" | "all"',
  "Dữ liệu thiếu không được xem là sức khỏe xấu",
  "không tự chẩn đoán",
  "Không quy đổi thành calo",
  "Không tính calo",
  "Không tạo điểm sức khỏe tổng",
  "không gửi nội dung này sang Trung tâm Quản trị",
  "visibleItems.slice(0, 120)",
  "aria-pressed",
]) {
  if (!timeline.includes(token)) throw new Error(`Health timeline thiếu contract: ${token}`);
}

if (!framework.includes('import HealthTimeline from "./health-timeline"')) {
  throw new Error("Health framework thiếu import HealthTimeline");
}
if (!framework.includes('<HealthTimeline state={state} endDate={dayKey} />')) {
  throw new Error("Health framework chưa tích hợp timeline trong Nhật ký");
}
if (!page.includes('import "./health-timeline.css"')) {
  throw new Error("Health page chưa nạp health timeline CSS");
}
for (const token of ["health-timeline-metrics", "health-timeline-list", ".is-selected", "@media (max-width: 560px)", "prefers-reduced-motion"]) {
  if (!styles.includes(token)) throw new Error(`Health timeline CSS thiếu contract: ${token}`);
}

console.log("Health timeline PASS: local-first cross-domain history, filters, 30/90/all ranges and non-diagnostic boundaries are integrated.");
