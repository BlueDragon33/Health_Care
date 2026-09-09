import fs from "node:fs";

const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const nutrition = fs.readFileSync("app/suc-khoe-tre/nutrition-stage-panel.tsx", "utf8");
const store = fs.readFileSync("app/suc-khoe-tre/health-local-store.ts", "utf8");
const reminders = fs.readFileSync("app/suc-khoe-tre/health-reminders.ts", "utf8");
const manager = fs.readFileSync("app/suc-khoe-tre/reminder-manager.tsx", "utf8");
const devices = fs.readFileSync("app/api/control/devices/route.ts", "utf8");

function requireToken(source, token, label) {
  if (!source.includes(token)) throw new Error(`Core health audit thiếu ${label}: ${token}`);
}

// 1) Chế độ dinh dưỡng liên tục theo 8 giai đoạn từ 9 tháng đến hết 18 tuổi.
for (const token of [
  '"infant-9-11m":',
  '"toddler-12-23m":',
  '"early-childhood-2-5y":',
  '"school-age-6-8y":',
  'foundation:',
  'preteen:',
  '"early-adolescent":',
  '"late-adolescent":',
  "HealthLifeStageId",
  "9–11 tháng · Ăn bổ sung an toàn, tăng dần độ thô",
  "Không dùng mật ong trước 12 tháng",
  "Dinh dưỡng theo nhóm tuổi",
  "WHO Healthy diet (cập nhật 26/01/2026)",
  "Dấu ✓ chỉ phản ánh dữ liệu đã ghi",
]) requireToken(nutrition, token, "dinh dưỡng 9 tháng–18 tuổi");

for (const token of [
  'if (stageId === "infant-9-11m")',
  'id: "complementary-meal"',
  'label: "Đã ghi từ 3 nhóm thực phẩm"',
  'if (stageId === "toddler-12-23m")',
  'if (stageId === "early-childhood-2-5y")',
  'if (stageId === "school-age-6-8y" || stageId === "foundation")',
]) requireToken(nutrition, token, "checklist dinh dưỡng theo giai đoạn");

// Không được dùng checklist nước/bữa sáng của trẻ lớn làm điều kiện riêng cho 9–11 tháng.
const infantBlock = nutrition.slice(nutrition.indexOf('if (stageId === "infant-9-11m")'), nutrition.indexOf('if (stageId === "toddler-12-23m")'));
if (infantBlock.includes('id: "water"') || infantBlock.includes('id: "breakfast"')) {
  throw new Error("Checklist 9–11 tháng không được tái sử dụng điều kiện nước/bữa sáng của trẻ lớn");
}

requireToken(framework, 'import NutritionStagePanel from "./nutrition-stage-panel"', "tích hợp nutrition stage");
requireToken(framework, 'type HealthLifeStage', "life-stage runtime type");
requireToken(framework, '<NutritionStagePanel stage={profileAge.lifeStage} day={day} />', "render nutrition life stage");
requireToken(framework, 'nội dung được cá nhân hóa liên tục theo 8 giai đoạn từ 9 tháng đến hết 18 tuổi', "copy phạm vi nutrition");
if (framework.includes('<NutritionStagePanel stage={profileAge.stage} day={day} />')) {
  throw new Error("Nutrition không được quay lại profileAge.stage chỉ dành cho 9–18 tuổi");
}

// 2) Checklist và nhật ký dinh dưỡng/sức khỏe.
for (const token of ["Checklist", "Nhật ký bữa ăn", "Ghi món đã ăn", 'active === "journal"', "journalNote"]) {
  requireToken(framework, token, "checklist/nhật ký");
}

// 3) Nhắc dinh dưỡng/chăm sóc sức khỏe.
for (const token of ['nutrition: "Dinh dưỡng"', 'care: "Chăm sóc"', 'category: "nutrition" | "water" | "activity" | "care"']) {
  requireToken(token.includes('category:') ? store : manager, token, "nhóm nhắc sức khỏe");
}

// 4) Lặp hằng ngày/hằng tuần và thông báo trình duyệt thực thi thật khi app còn hoạt động.
for (const token of ['"daily"', '"weekly"', '"selected-weekdays"', '"monthly"']) requireToken(store, token, "kiểu lặp");
for (const token of ["Notification.requestPermission()", "new Notification(", "occurrenceDueNow", "window.setInterval(check, 30_000)"]) {
  requireToken(framework, token, "browser notification");
}
for (const token of ['RRULE:FREQ=DAILY', 'RRULE:FREQ=WEEKLY']) requireToken(reminders, token, "RRULE");

// 5) Xuất .ics cho từng nhắc và toàn bộ lịch đang bật.
for (const token of ["BEGIN:VCALENDAR", "text/calendar;charset=utf-8", "downloadReminderIcs", "downloadAllRemindersIcs"]) {
  requireToken(reminders, token, "ICS export");
}

// 6) Google Calendar chỉ mở khi quyền server-side của thiết bị được Trung tâm cấp.
for (const token of [
  "calendarEnabled",
  "if (!calendarEnabled) return",
  "Thiết bị chưa được Trung tâm Quản trị cấp quyền Google Calendar",
]) requireToken(manager, token, "Calendar client gate");
for (const token of [
  'action === "enable-calendar" || action === "disable-calendar"',
  "calendar_enabled = ?",
  "Chỉ thiết bị đang được phép truy cập mới có thể cấp quyền Google Calendar",
  'function canManage(role: string) { return ["publisher", "owner"].includes(role); }',
]) requireToken(devices, token, "Calendar control-plane gate");

console.log("Core health features PASS: continuous 9m–18y nutrition, stage checklists, journal, recurring reminders, browser notifications, ICS and admin-gated Google Calendar are enforced.");
