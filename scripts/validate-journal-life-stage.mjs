import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const journal = fs.readFileSync("app/suc-khoe-tre/journal-life-stage.tsx", "utf8");

function need(source, token, label) {
  if (!source.includes(token)) throw new Error(`Journal V12 thiếu ${label}: ${token}`);
}

function exactlyOnce(source, token, label) {
  const count = source.split(token).length - 1;
  if (count !== 1) throw new Error(`Journal V12 yêu cầu đúng 1 ${label}, hiện có ${count}: ${token}`);
}

for (const id of [
  '"infant-9-11m"',
  '"toddler-12-23m"',
  '"early-childhood-2-5y"',
  '"school-age-6-8y"',
  'foundation:',
  'preteen:',
  '"early-adolescent"',
  '"late-adolescent"',
]) need(journal, id, "đủ 8 life stage");

for (const token of [
  "Nhật ký quan sát của người chăm sóc",
  "Bú/ăn kém",
  "Ít tiểu",
  "Khó thở",
  "Lừ đừ / khó đánh thức",
  "Nhật ký chỉ ghi quan sát",
  "tự chẩn đoán",
  "không thay thế đánh giá chuyên môn",
  "journalObservationOptionsForLifeStage",
  "journalConfigForLifeStage",
]) need(journal, token, "infant/adolescent journal safety");

const journalImport = 'import JournalStagePanel, { journalConfigForLifeStage, journalObservationOptionsForLifeStage } from "./journal-life-stage"';
const journalConfigMemo = 'const journalConfig = useMemo(() => journalConfigForLifeStage(profileAge.lifeStage)';
const journalObservationsMemo = 'const journalObservations = useMemo(() => journalObservationOptionsForLifeStage(profileAge.lifeStage)';
const journalPanel = '<JournalStagePanel stage={profileAge.lifeStage} />';

exactlyOnce(framework, journalImport, "Journal import");
exactlyOnce(framework, journalConfigMemo, "journalConfig memo");
exactlyOnce(framework, journalObservationsMemo, "journalObservations memo");
exactlyOnce(framework, journalPanel, "JournalStagePanel render");

for (const token of [
  'journalObservations.map(',
  '{journalConfig.feelingPrompt}',
]) need(framework, token, "runtime integration");

if (framework.includes('const symptoms = ["Đau đầu"')) {
  throw new Error("Journal V12 không được quay lại danh sách triệu chứng cố định cho mọi tuổi");
}

for (const forbidden of ["/api/control", "CONTROL_SERVICE_SECRET", "diagnose(", "recommendTreatment", "calculateDose", "healthScore"]) {
  if (journal.includes(forbidden)) throw new Error(`Journal life-stage không được chứa control/clinical scoring: ${forbidden}`);
}
if (/\bfetch\s*\(/.test(journal)) throw new Error("Journal life-stage không được gọi network trực tiếp");

console.log("Journal V12 PASS: age-aware observation prompts/options cover 9 months–18 years with exactly-one runtime wiring and without diagnosis, treatment generation or control-plane leakage.");
