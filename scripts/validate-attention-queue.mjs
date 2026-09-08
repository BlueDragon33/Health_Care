import fs from "node:fs";

const engine = fs.readFileSync("app/suc-khoe-tre/health-attention-engine.ts", "utf8");
const queue = fs.readFileSync("app/suc-khoe-tre/attention-queue.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/attention-queue.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Attention Queue V1 thiếu ${label}: ${token}`);
}

for (const token of [
  "buildOperationalAttentionSnapshot",
  "DUE_WINDOW_MS = 24 * 60 * 60 * 1000",
  "MAX_PRIMARY_ITEMS = 5",
  'priority: "due"',
  'priority: "info"',
  'source: "user-reminder"',
  'source: "data-quality"',
  "trends: []",
  "openEpisodes: []",
]) need(engine, token, "operational engine contract");

if (engine.includes('priority: "urgent"')) throw new Error("Attention Queue V1 không được tự tạo urgent clinical signal");
if (engine.includes("overallHealthScore") || engine.includes("healthScore")) throw new Error("Attention Queue không được tạo điểm sức khỏe tổng");

for (const token of [
  "Đây không phải điểm sức khỏe.",
  "Chưa kích hoạt cảnh báo y khoa tự động.",
  "Ngày trống hoặc ít dữ liệu không được hiểu là sức khỏe xấu.",
  "không sinh cảnh báo khẩn",
]) need(queue, token, "safety copy");

need(framework, 'import AttentionQueue from "./attention-queue"', "framework import");
need(framework, '<AttentionQueue state={state} onNavigate={(target) => setActive(target)} />', "Today integration");
need(page, 'import "./attention-queue.css"', "stylesheet integration");

for (const token of ["box-shadow: inset", ":focus-visible", "@media (max-width: 520px)", "@media (prefers-reduced-motion: reduce)"]) need(styles, token, "3D/accessibility style");

console.log("Attention Queue V1 PASS: max-5 operational due/data-gap items, no clinical urgency, no health score, responsive/accessibility integration present.");
