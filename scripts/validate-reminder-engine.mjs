import fs from "node:fs";

const store = fs.readFileSync("app/suc-khoe-tre/health-local-store.ts", "utf8");
const engine = fs.readFileSync("app/suc-khoe-tre/health-reminders.ts", "utf8");
const manager = fs.readFileSync("app/suc-khoe-tre/reminder-manager.tsx", "utf8");
const styles = fs.readFileSync("app/suc-khoe-tre/reminder-manager.css", "utf8");
const framework = fs.readFileSync("app/suc-khoe-tre/health-framework.tsx", "utf8");
const page = fs.readFileSync("app/suc-khoe-tre/page.tsx", "utf8");

function requireToken(source, token, label) {
  if (!source.includes(token)) throw new Error(`Reminder Engine V2 thiếu ${label}: ${token}`);
}

for (const token of ["selected-weekdays", "monthly", "weekdays?: number[]"]) requireToken(store, token, "schema recurrence");
requireToken(store, 'const repeats = ["once", "daily", "weekdays", "weekly", "selected-weekdays", "monthly"]', "normalize legacy/new reminder");
requireToken(store, "value >= 0 && value <= 6", "weekday sanitization");

for (const token of [
  'reminder.repeat === "selected-weekdays"',
  'reminder.repeat === "monthly"',
  "RRULE:FREQ=MONTHLY;BYMONTHDAY=",
  "RRULE:FREQ=WEEKLY;BYDAY=",
  "downloadAllRemindersIcs",
  "reminderCalendarIcs",
  "Reminder Calendar 9-18",
  "Sức khỏe Y tế 9–18 tuổi",
]) requireToken(engine, token, "calendar/recurrence engine");

if (engine.includes("Sức khỏe Y tế 9–10 tuổi") || engine.includes("Reminder 9-10")) {
  throw new Error("Reminder export còn metadata 9–10 cũ");
}

for (const token of [
  "Lịch & nhắc việc tập trung",
  "Theo ngày chọn",
  "Hằng tháng",
  "Xuất lịch đang bật (.ics)",
  "aria-pressed={weekdays.includes(item.value)}",
  "aria-pressed={filter === value}",
  "calendarEnabled",
  "if (!calendarEnabled) return",
  "Thiết bị chưa được Trung tâm Quản trị cấp quyền Google Calendar",
  "Thông báo trình duyệt chỉ được kiểm tra khi Web App còn hoạt động",
]) requireToken(manager, token, "manager behavior");

requireToken(framework, 'import ReminderManager, { repeatLabels } from "./reminder-manager"', "framework import");
requireToken(framework, '<ReminderManager state={state} setState={setState} calendarEnabled={device.calendarEnabled} />', "framework integration");
if (framework.includes('<span className="hf-kicker">Reminder Engine</span>')) throw new Error("Reminder UI cũ vẫn tồn tại song song");
requireToken(page, 'import "./reminder-manager.css"', "stylesheet integration");

for (const token of ["box-shadow: inset", ":focus-visible", "@media (max-width: 520px)", "@media (prefers-reduced-motion: reduce)"]) {
  requireToken(styles, token, "3D/accessibility style");
}

console.log("Reminder Engine V2 PASS: legacy-compatible recurrence, selected weekdays/monthly, bulk ICS, device-gated Calendar and centralized UI are present.");
