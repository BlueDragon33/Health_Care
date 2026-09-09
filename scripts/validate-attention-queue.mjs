import fs from "node:fs";

const engine = fs.readFileSync("app/suc-khoe-tre/health-attention-engine.ts", "utf8");
const queue = fs.readFileSync("app/suc-khoe-tre/attention-queue.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/attention-queue.css", "utf8");
const referenceStyles = fs.readFileSync("app/suc-khoe-tre/reference-dashboard-v5.css", "utf8");
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
  "profileId: string",
]) need(engine, token, "operational engine contract");

if (engine.includes('priority: "urgent"')) throw new Error("Attention Queue V1 không được tự tạo urgent clinical signal");
if (engine.includes("overallHealthScore") || engine.includes("healthScore")) throw new Error("Attention Queue không được tạo điểm sức khỏe tổng");
if (engine.includes('LOCAL_PRIMARY_PROFILE_ID = "local-primary"')) throw new Error("Attention Queue không được hard-code một profileId toàn thiết bị sau Multi-profile V1");

for (const token of [
  "Ngày trống không được hiểu là sức khỏe xấu.",
  "Phần trăm chỉ phản ánh số ngày có ghi dữ liệu, không phải điểm sức khỏe.",
  "Không tạo điểm sức khỏe tổng, không tự chẩn đoán",
  "profileId: string",
  "buildOperationalAttentionSnapshot(state, profileId)",
  "Việc cần chú ý hôm nay",
]) need(queue, token, "safety/profile/reference-dashboard copy");

if (queue.includes("overallHealthScore") || queue.includes("healthScore")) throw new Error("Reference Today dashboard không được tạo điểm sức khỏe tổng");
if (/priority:\s*"urgent"/.test(queue)) throw new Error("Reference Today dashboard không được sinh clinical urgent signal; chỉ render signal do engine cung cấp");

need(framework, 'import AttentionQueue from "./attention-queue"', "framework import");
need(framework, 'profileId={activeProfileId}', "active-profile Today integration");
need(page, 'import "./attention-queue.css"', "legacy stylesheet integration");
need(page, 'import "./reference-dashboard-v5.css"', "reference dashboard stylesheet integration");

for (const token of ["box-shadow: inset", ":focus-visible", "@media (max-width: 520px)", "@media (prefers-reduced-motion: reduce)"]) need(styles, token, "legacy 3D/accessibility style");
for (const token of [".ref-dashboard-grid", ".ref-attention-card", ".ref-growth-card", ".ref-range-tabs", "@media(max-width:620px)", "@media(prefers-reduced-motion:reduce)"]) need(referenceStyles, token, "reference Today responsive/accessibility style");

console.log("Attention Queue V1/V5 PASS: profile-scoped due/data-gap engine is preserved inside reference Today dashboard; no clinical urgency or health score generated.");
