from pathlib import Path

# 1) Local-store schema: preserve legacy reminders while adding selected weekdays + monthly.
p = Path("app/suc-khoe-tre/health-local-store.ts")
text = p.read_text()
text = text.replace(
    'export type ReminderRepeat = "once" | "daily" | "weekdays" | "weekly";',
    'export type ReminderRepeat = "once" | "daily" | "weekdays" | "weekly" | "selected-weekdays" | "monthly";',
    1,
)
text = text.replace(
    '  repeat: ReminderRepeat;\n  enabled: boolean;',
    '  repeat: ReminderRepeat;\n  weekdays?: number[];\n  enabled: boolean;',
    1,
)
text = text.replace(
    '  const repeats = ["once", "daily", "weekdays", "weekly"];',
    '  const repeats = ["once", "daily", "weekdays", "weekly", "selected-weekdays", "monthly"];',
    1,
)
old = '''      repeat: repeats.includes(String(source.repeat)) ? source.repeat as ReminderRepeat : "once",
      enabled: source.enabled !== false,'''
new = '''      repeat: repeats.includes(String(source.repeat)) ? source.repeat as ReminderRepeat : "once",
      weekdays: Array.isArray(source.weekdays)
        ? [...new Set(source.weekdays.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))].sort((a, b) => a - b)
        : undefined,
      enabled: source.enabled !== false,'''
if old not in text:
    raise SystemExit("safeReminders insertion point not found")
text = text.replace(old, new, 1)
p.write_text(text)

# 2) Main framework: centralize reminder UI in ReminderManager.
p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()
text = text.replace(
    'import { downloadReminderIcs, googleCalendarUrl, nextReminderOccurrence, occurrenceDueNow } from "./health-reminders";',
    'import { nextReminderOccurrence, occurrenceDueNow } from "./health-reminders";',
    1,
)
anchor_import = 'import HealthTimeline from "./health-timeline";\n'
if anchor_import not in text:
    raise SystemExit("HealthTimeline import not found")
text = text.replace(anchor_import, anchor_import + 'import ReminderManager, { repeatLabels } from "./reminder-manager";\n', 1)
old_repeat = 'const repeatLabels: Record<Reminder["repeat"], string> = { once: "Một lần", daily: "Hằng ngày", weekdays: "Thứ 2–6", weekly: "Hằng tuần" };\n'
text = text.replace(old_repeat, "", 1)

for line in [
    '  const [reminderTitle, setReminderTitle] = useState("");\n',
    '  const [reminderCategory, setReminderCategory] = useState<Reminder["category"]>("care");\n',
    '  const [reminderDate, setReminderDate] = useState("");\n',
    '  const [reminderTime, setReminderTime] = useState("19:30");\n',
    '  const [reminderRepeat, setReminderRepeat] = useState<Reminder["repeat"]>("daily");\n',
    '      setReminderDate(today);\n',
]:
    text = text.replace(line, "", 1)

start = text.find('  function addReminder() {')
end = text.find('  async function requestNotifications()', start)
if start < 0 or end < 0:
    raise SystemExit("addReminder block not found")
text = text[:start] + text[end:]

start = text.find('  function openGoogleCalendar(reminder: Reminder) {')
end = text.find('  function downloadBackup()', start)
if start < 0 or end < 0:
    raise SystemExit("openGoogleCalendar block not found")
text = text[:start] + text[end:]

reminder_start_token = '          <section className="hf-panel"><div className="hf-panel-head"><div><span className="hf-kicker">Reminder Engine</span>'
start = text.find(reminder_start_token)
end = text.find('        </section> : null}', start)
if start < 0 or end < 0:
    raise SystemExit("inline reminder UI block not found")
text = text[:start] + '          <ReminderManager state={state} setState={setState} calendarEnabled={device.calendarEnabled} />\n' + text[end:]
p.write_text(text)

# 3) Load manager stylesheet.
p = Path("app/suc-khoe-tre/page.tsx")
text = p.read_text()
anchor = 'import "./health-timeline.css";\n'
if anchor not in text:
    raise SystemExit("health-timeline.css import not found")
if 'import "./reminder-manager.css";' not in text:
    text = text.replace(anchor, anchor + 'import "./reminder-manager.css";\n', 1)
p.write_text(text)

# 4) Wire validator into framework gate.
p = Path("package.json")
text = p.read_text()
old = '"validate:framework": "node scripts/validate-health-framework.mjs && node scripts/validate-weekly-summary.mjs && node scripts/validate-health-timeline.mjs"'
new = '"validate:framework": "node scripts/validate-health-framework.mjs && node scripts/validate-weekly-summary.mjs && node scripts/validate-health-timeline.mjs && node scripts/validate-reminder-engine.mjs"'
if old not in text:
    raise SystemExit("package validate:framework chain not found")
text = text.replace(old, new, 1)
p.write_text(text)
