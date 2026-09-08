"use client";

import { useMemo, useState } from "react";
import { uid, type HealthLocalState, type Reminder, type ReminderRepeat } from "./health-local-store";
import { downloadAllRemindersIcs, downloadReminderIcs, googleCalendarUrl, nextReminderOccurrence } from "./health-reminders";

const categoryLabels: Record<Reminder["category"], string> = {
  nutrition: "Dinh dưỡng",
  water: "Nước",
  activity: "Vận động",
  care: "Chăm sóc",
  growth: "Đo tăng trưởng",
  appointment: "Lịch khám",
  other: "Khác",
};

export const repeatLabels: Record<ReminderRepeat, string> = {
  once: "Một lần",
  daily: "Hằng ngày",
  weekdays: "Thứ 2–6",
  weekly: "Hằng tuần",
  "selected-weekdays": "Theo ngày chọn",
  monthly: "Hằng tháng",
};

const weekdayOptions = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 0, label: "CN" },
];

type Filter = "all" | "enabled" | "disabled";

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(value: Date | null) {
  if (!value) return "Không còn lần nhắc sắp tới";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(value);
}

function weekdayText(reminder: Reminder) {
  if (reminder.repeat !== "selected-weekdays") return "";
  const selected = weekdayOptions.filter((item) => reminder.weekdays?.includes(item.value)).map((item) => item.label);
  return selected.length ? ` · ${selected.join(", ")}` : "";
}

export default function ReminderManager({
  state,
  setState,
  calendarEnabled,
}: {
  state: HealthLocalState;
  setState: React.Dispatch<React.SetStateAction<HealthLocalState>>;
  calendarEnabled: boolean;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Reminder["category"]>("care");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("19:30");
  const [repeat, setRepeat] = useState<ReminderRepeat>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const now = new Date();
    return state.reminders
      .map((reminder) => ({ reminder, next: nextReminderOccurrence(reminder, now) }))
      .sort((a, b) => {
        if (a.next && b.next) return a.next.getTime() - b.next.getTime();
        if (a.next) return -1;
        if (b.next) return 1;
        return a.reminder.title.localeCompare(b.reminder.title, "vi");
      });
  }, [state.reminders]);

  const visible = sorted.filter(({ reminder }) => {
    if (filter === "enabled" && !reminder.enabled) return false;
    if (filter === "disabled" && reminder.enabled) return false;
    const needle = query.trim().toLocaleLowerCase("vi");
    if (!needle) return true;
    return `${reminder.title} ${categoryLabels[reminder.category]} ${repeatLabels[reminder.repeat]}`.toLocaleLowerCase("vi").includes(needle);
  });

  const enabledCount = state.reminders.filter((item) => item.enabled).length;
  const disabledCount = state.reminders.length - enabledCount;
  const upcomingCount = sorted.filter((item) => item.next !== null).length;

  function toggleWeekday(value: number) {
    setWeekdays((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort((a, b) => a - b));
  }

  function addReminder() {
    const cleanTitle = title.trim();
    if (!cleanTitle || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return;
    if (repeat === "selected-weekdays" && weekdays.length === 0) return;
    const reminder: Reminder = {
      id: uid("reminder"),
      title: cleanTitle.slice(0, 100),
      category,
      date,
      time,
      repeat,
      weekdays: repeat === "selected-weekdays" ? [...weekdays] : undefined,
      enabled: true,
    };
    setState((current) => ({ ...current, reminders: [...current.reminders, reminder].slice(-200) }));
    setTitle("");
  }

  function updateReminder(id: string, change: (current: Reminder) => Reminder) {
    setState((current) => ({ ...current, reminders: current.reminders.map((item) => item.id === id ? change(item) : item) }));
  }

  function removeReminder(id: string) {
    setState((current) => ({ ...current, reminders: current.reminders.filter((item) => item.id !== id) }));
  }

  function openGoogleCalendar(reminder: Reminder) {
    if (!calendarEnabled) return;
    const url = googleCalendarUrl(reminder);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return <section className="reminder-manager" aria-label="Quản lý lịch nhắc sức khỏe">
    <div className="reminder-manager-head">
      <div><span className="hf-kicker">Reminder Engine V2</span><h3>Lịch & nhắc việc tập trung</h3><p>Tạo một lần, hằng ngày, theo thứ trong tuần, hằng tuần hoặc hằng tháng. Lịch vẫn lưu local-first trên thiết bị.</p></div>
      <button type="button" className="reminder-export-all" disabled={!enabledCount} onClick={() => downloadAllRemindersIcs(state.reminders)}>Xuất lịch đang bật (.ics)</button>
    </div>

    <div className="reminder-overview">
      <article><span>Đang bật</span><strong>{enabledCount}</strong></article>
      <article><span>Đang tắt</span><strong>{disabledCount}</strong></article>
      <article><span>Còn lịch sắp tới</span><strong>{upcomingCount}</strong></article>
    </div>

    <div className="reminder-create-grid">
      <label className="reminder-wide">Tên nhắc việc<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="Ví dụ: Đánh răng buổi tối" /></label>
      <label>Nhóm<select value={category} onChange={(event) => setCategory(event.target.value as Reminder["category"])}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Ngày bắt đầu<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label>Giờ<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
      <label>Lặp<select value={repeat} onChange={(event) => setRepeat(event.target.value as ReminderRepeat)}>{Object.entries(repeatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="hf-primary reminder-add" type="button" onClick={addReminder}>Thêm nhắc việc</button>
    </div>

    {repeat === "selected-weekdays" ? <div className="reminder-weekdays" role="group" aria-label="Chọn ngày trong tuần">
      {weekdayOptions.map((item) => <button key={item.value} type="button" aria-pressed={weekdays.includes(item.value)} className={weekdays.includes(item.value) ? "is-selected" : ""} onClick={() => toggleWeekday(item.value)}>{item.label}</button>)}
    </div> : null}

    <div className="reminder-toolbar">
      <div className="reminder-filter" role="group" aria-label="Lọc trạng thái nhắc việc">
        {(["all", "enabled", "disabled"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} className={filter === value ? "is-selected" : ""} onClick={() => setFilter(value)}>{value === "all" ? "Tất cả" : value === "enabled" ? "Đang bật" : "Đang tắt"}</button>)}
      </div>
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, nhóm, kiểu lặp…" aria-label="Tìm nhắc việc" />
    </div>

    {visible.length ? <div className="reminder-list-v2">
      {visible.map(({ reminder, next }) => <article key={reminder.id} className={reminder.enabled ? "" : "is-disabled"}>
        <div className="reminder-card-main">
          <span>{categoryLabels[reminder.category]}</span>
          <strong>{reminder.title}</strong>
          <small>{reminder.date} · {reminder.time} · {repeatLabels[reminder.repeat]}{weekdayText(reminder)}</small>
          <em>Lần tới: {formatDateTime(next)}</em>
        </div>
        <div className="reminder-card-actions">
          <button type="button" onClick={() => updateReminder(reminder.id, (current) => ({ ...current, enabled: !current.enabled }))}>{reminder.enabled ? "Tắt" : "Bật"}</button>
          <button type="button" onClick={() => downloadReminderIcs(reminder)}>Tải .ics</button>
          <button type="button" disabled={!calendarEnabled} title={calendarEnabled ? "Mở Google Calendar" : "Thiết bị chưa được Trung tâm Quản trị cấp quyền Google Calendar"} onClick={() => openGoogleCalendar(reminder)}>Google Calendar</button>
          <button type="button" onClick={() => removeReminder(reminder.id)}>Xóa</button>
        </div>
      </article>)}
    </div> : <div className="hf-empty">Không có nhắc việc phù hợp bộ lọc.</div>}

    {!calendarEnabled ? <div className="reminder-calendar-lock"><strong>Google Calendar đang khóa trên thiết bị này.</strong><span>Chỉ Trung tâm Quản trị có thể cấp quyền. Xuất `.ics` vẫn hoạt động độc lập.</span></div> : null}
    <p className="reminder-boundary">Thông báo trình duyệt chỉ được kiểm tra khi Web App còn hoạt động. Muốn nhắc ổn định khi ứng dụng đóng, dùng `.ics` hoặc Calendar của hệ điều hành/tài khoản đã được cấp quyền.</p>
  </section>;
}
