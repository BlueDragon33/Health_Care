import fs from "node:fs";

const path = "app/suc-khoe-tre/health-framework.tsx";
let source = fs.readFileSync(path, "utf8");
let changed = false;

const importAnchor = 'import ReminderManager, { repeatLabels } from "./reminder-manager";';
const nutritionImport = 'import NutritionStagePanel from "./nutrition-stage-panel";';
if (!source.includes(nutritionImport)) {
  if (!source.includes(importAnchor)) throw new Error("Không tìm thấy import anchor cho NutritionStagePanel.");
  source = source.replace(importAnchor, `${importAnchor}\n${nutritionImport}`);
  changed = true;
}

const nutritionAnchor = `        {active === "nutrition" ? <section className="hf-section">\n          <SectionHeader title="Dinh dưỡng" description="Checklist nhóm thực phẩm, nước và nhật ký bữa ăn theo ngày. Mục tiêu sau này được cấu hình theo từng giai đoạn 9–18, không dùng chế độ giảm cân người lớn cho trẻ." aside={formatDate(dayKey)} />\n          <StagePanel stage={profileAge.stage} />`;
const nutritionReplacement = `        {active === "nutrition" ? <section className="hf-section">\n          <SectionHeader title="Dinh dưỡng" description="Checklist nhóm thực phẩm, nước và nhật ký bữa ăn theo ngày; nội dung được cá nhân hóa theo 4 giai đoạn 9–18 tuổi và không dùng chế độ giảm cân người lớn cho trẻ." aside={formatDate(dayKey)} />\n          <StagePanel stage={profileAge.stage} />\n          <NutritionStagePanel stage={profileAge.stage} day={day} />`;
if (!source.includes('<NutritionStagePanel stage={profileAge.stage} day={day} />')) {
  if (!source.includes(nutritionAnchor)) throw new Error("Không tìm thấy nutrition section anchor.");
  source = source.replace(nutritionAnchor, nutritionReplacement);
  changed = true;
}

if (changed) {
  fs.writeFileSync(path, source);
  console.log("Applied age nutrition integration to health-framework.tsx");
} else {
  console.log("Age nutrition integration already applied; no changes.");
}
