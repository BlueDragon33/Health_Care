"use client";

import { useMemo } from "react";
import { currentDay, recentDateKeys, type DailyRecord, type HealthLocalState } from "./health-local-store";

export type WeeklyHealthMode = "nutrition" | "activity" | "care";

const FOOD_GROUPS = ["Đạm", "Rau", "Trái cây", "Sữa / tương đương", "Ngũ cốc / tinh bột", "Nước"];

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date)
    : value;
}

function sleepHours(record: DailyRecord) {
  if (!/^\d{2}:\d{2}$/.test(record.sleepStart) || !/^\d{2}:\d{2}$/.test(record.sleepEnd)) return null;
  const [sh, sm] = record.sleepStart.split(":").map(Number);
  const [eh, em] = record.sleepEnd.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  if (!(minutes > 0 && minutes <= 24 * 60)) return null;
  return minutes / 60;
}

function dayHasNutrition(record: DailyRecord) {
  return record.foodGroups.length > 0 || record.waterCups > 0 || record.meals.length > 0;
}

function dayActivityMinutes(record: DailyRecord) {
  return record.activities.reduce((sum, entry) => sum + entry.minutes, 0);
}

function barPercent(value: number, max: number) {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.max(4, Math.min(100, Math.round((value / max) * 100)));
}

function NutritionSummary({ rows }: { rows: { key: string; record: DailyRecord }[] }) {
  const loggedDays = rows.filter(({ record }) => dayHasNutrition(record)).length;
  const mealCount = rows.reduce((sum, { record }) => sum + record.meals.length, 0);
  const waterLoggedDays = rows.filter(({ record }) => record.waterCups > 0).length;
  const totalWaterCups = rows.reduce((sum, { record }) => sum + record.waterCups, 0);
  const groupCounts = FOOD_GROUPS.map((group) => ({ group, days: rows.filter(({ record }) => record.foodGroups.includes(group)).length }));

  return <>
    <div className="weekly-summary-metrics">
      <article><span>Ngày có ghi dinh dưỡng</span><strong>{loggedDays}/7</strong><small>Chỉ phản ánh ngày đã nhập dữ liệu.</small></article>
      <article><span>Bản ghi bữa ăn</span><strong>{mealCount}</strong><small>Không tính calo hoặc chấm điểm món ăn.</small></article>
      <article><span>Ngày có ghi nước</span><strong>{waterLoggedDays}/7</strong><small>{totalWaterCups} cốc đã ghi trong 7 ngày.</small></article>
    </div>
    <div className="weekly-group-grid" aria-label="Số ngày đã đánh dấu từng nhóm thực phẩm">
      {groupCounts.map((item) => <article key={item.group}><span>{item.group}</span><strong>{item.days}/7 ngày</strong><div className="weekly-mini-track"><span style={{ width: `${(item.days / 7) * 100}%` }} /></div></article>)}
    </div>
    <div className="weekly-day-bars" aria-label="Nhóm thực phẩm đã ghi theo từng ngày">
      {rows.map(({ key, record }) => <article key={key}><span>{formatShortDate(key)}</span><div className="weekly-bar-track"><span style={{ width: `${(Math.min(FOOD_GROUPS.length, record.foodGroups.length) / FOOD_GROUPS.length) * 100}%` }} /></div><strong>{record.foodGroups.length}/{FOOD_GROUPS.length} nhóm</strong><small>{record.waterCups} cốc · {record.meals.length} bữa ghi</small></article>)}
    </div>
    <p className="weekly-summary-boundary">Tổng hợp này mô tả việc đã ghi. Ứng dụng chưa áp một lượng nước, khẩu phần hoặc mục tiêu năng lượng giống nhau cho mọi trẻ/vị thành niên.</p>
  </>;
}

function ActivitySummary({ rows }: { rows: { key: string; record: DailyRecord }[] }) {
  const minutes = rows.map(({ record }) => dayActivityMinutes(record));
  const total = minutes.reduce((sum, value) => sum + value, 0);
  const loggedDays = minutes.filter((value) => value > 0).length;
  const max = Math.max(0, ...minutes);
  const types = [...new Set(rows.flatMap(({ record }) => record.activities.map((entry) => entry.type)))];

  return <>
    <div className="weekly-summary-metrics">
      <article><span>Tổng phút đã ghi</span><strong>{total}</strong><small>Phút hoạt động trong 7 ngày.</small></article>
      <article><span>Ngày có vận động ghi nhận</span><strong>{loggedDays}/7</strong><small>Ngày không ghi không được xem là “không vận động”.</small></article>
      <article><span>Loại hoạt động</span><strong>{types.length}</strong><small>{types.length ? types.slice(0, 4).join(" · ") : "Chưa có hoạt động được ghi."}</small></article>
    </div>
    <div className="weekly-day-bars" aria-label="Số phút vận động đã ghi theo từng ngày">
      {rows.map(({ key, record }) => { const value = dayActivityMinutes(record); return <article key={key}><span>{formatShortDate(key)}</span><div className="weekly-bar-track"><span style={{ width: `${barPercent(value, max)}%` }} /></div><strong>{value} phút</strong><small>{record.activities.length ? record.activities.map((entry) => entry.type).join(" · ") : "Chưa ghi"}</small></article>; })}
    </div>
    <p className="weekly-summary-boundary">Độ dài cột được chuẩn hóa theo ngày có số phút cao nhất trong chính tuần này, không phải mức khuyến nghị và không biểu diễn calo hay giảm cân.</p>
  </>;
}

function CareSummary({ rows }: { rows: { key: string; record: DailyRecord }[] }) {
  const sleep = rows.map(({ record }) => sleepHours(record));
  const sleepValues = sleep.filter((value): value is number => value !== null);
  const averageSleep = sleepValues.length ? sleepValues.reduce((sum, value) => sum + value, 0) / sleepValues.length : null;
  const maxSleep = Math.max(0, ...sleepValues);
  const brushingMorning = rows.filter(({ record }) => record.tasks.teethMorning).length;
  const brushingEvening = rows.filter(({ record }) => record.tasks.teethEvening).length;
  const hygieneDays = rows.filter(({ record }) => record.hygieneDone).length;
  const eyeBreaks = rows.reduce((sum, { record }) => sum + record.eyeBreaks, 0);

  return <>
    <div className="weekly-summary-metrics">
      <article><span>Ngày có đủ giờ ngủ/thức</span><strong>{sleepValues.length}/7</strong><small>{averageSleep === null ? "Chưa đủ dữ liệu." : `Trung bình các ngày đã ghi: ${averageSleep.toFixed(1)} giờ.`}</small></article>
      <article><span>Đánh răng đã đánh dấu</span><strong>{brushingMorning + brushingEvening}</strong><small>Sáng {brushingMorning}/7 · tối {brushingEvening}/7.</small></article>
      <article><span>Tự chăm sóc</span><strong>{hygieneDays}/7</strong><small>{eyeBreaks} lần nghỉ mắt đã ghi.</small></article>
    </div>
    <div className="weekly-day-bars" aria-label="Thời lượng ngủ đã ghi theo từng ngày">
      {rows.map(({ key, record }, index) => { const value = sleep[index]; return <article key={key}><span>{formatShortDate(key)}</span><div className="weekly-bar-track"><span style={{ width: `${value === null ? 0 : barPercent(value, maxSleep)}%` }} /></div><strong>{value === null ? "Chưa đủ giờ" : `${value.toFixed(1)} giờ`}</strong><small>Răng: {record.tasks.teethMorning ? "sáng ✓" : "sáng —"} · {record.tasks.teethEvening ? "tối ✓" : "tối —"}</small></article>; })}
    </div>
    <p className="weekly-summary-boundary">Thời lượng ngủ ở đây chỉ được tính từ giờ đi ngủ/thức dậy đã nhập. Chưa tự gắn nhãn “đủ/thiếu ngủ” nếu chưa áp nguồn khuyến nghị phù hợp đúng nhóm tuổi.</p>
  </>;
}

export default function WeeklyHealthSummary({ state, endDate, mode }: { state: HealthLocalState; endDate: string; mode: WeeklyHealthMode }) {
  const rows = useMemo(() => recentDateKeys(7, endDate).map((key) => ({ key, record: currentDay(state, key) })), [state, endDate]);
  const title = mode === "nutrition" ? "Dinh dưỡng 7 ngày" : mode === "activity" ? "Vận động 7 ngày" : "Chăm sóc 7 ngày";
  const description = mode === "nutrition"
    ? "Nhìn mức độ ghi nhận nhóm thực phẩm, nước và bữa ăn qua một tuần."
    : mode === "activity"
      ? "Nhìn số phút và loại hoạt động đã ghi, không chuyển thành calo hoặc mục tiêu giảm cân."
      : "Nhìn lại giấc ngủ, răng miệng, nghỉ mắt và vệ sinh đã ghi trong tuần.";

  return <section className="weekly-summary-card">
    <header><div><span className="hf-kicker">Tổng hợp mô tả · 7 ngày</span><h3>{title}</h3><p>{description}</p></div><small>Kết thúc tại {formatShortDate(endDate)}</small></header>
    {mode === "nutrition" ? <NutritionSummary rows={rows} /> : mode === "activity" ? <ActivitySummary rows={rows} /> : <CareSummary rows={rows} />}
  </section>;
}
