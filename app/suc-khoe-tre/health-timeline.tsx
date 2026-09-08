"use client";

import { useMemo, useState } from "react";
import type { DailyRecord, HealthLocalState } from "./health-local-store";

export type HealthTimelineKind = "growth" | "symptom" | "journal" | "care" | "activity" | "nutrition";
type TimelineFilter = "all" | HealthTimelineKind;
type TimelineRange = "30d" | "90d" | "all";

type TimelineItem = {
  id: string;
  date: string;
  kind: HealthTimelineKind;
  title: string;
  detail: string;
  meta?: string;
};

const KIND_LABELS: Record<HealthTimelineKind, string> = {
  growth: "Tăng trưởng",
  symptom: "Triệu chứng",
  journal: "Nhật ký",
  care: "Chăm sóc",
  activity: "Vận động",
  nutrition: "Dinh dưỡng",
};

const FEELING_LABELS: Record<Exclude<DailyRecord["feeling"], "">, string> = {
  good: "Khỏe",
  normal: "Bình thường",
  unwell: "Không khỏe",
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : value;
}

function shiftDateKey(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function careDetail(record: DailyRecord) {
  const parts: string[] = [];
  if (record.sleepStart || record.sleepEnd) {
    parts.push(`Ngủ ${record.sleepStart || "—"} → ${record.sleepEnd || "—"}`);
  }
  if (record.tasks.teethMorning || record.tasks.teethEvening) {
    const brushing = [record.tasks.teethMorning ? "sáng" : "", record.tasks.teethEvening ? "tối" : ""].filter(Boolean).join(" + ");
    parts.push(`Đánh răng ${brushing}`);
  }
  if (record.eyeBreaks > 0) parts.push(`${record.eyeBreaks} lần nghỉ mắt`);
  if (record.hygieneDone) parts.push("Đã đánh dấu vệ sinh/tự chăm sóc");
  return parts.join(" · ");
}

function hasCare(record: DailyRecord) {
  return Boolean(
    record.sleepStart ||
    record.sleepEnd ||
    record.tasks.teethMorning ||
    record.tasks.teethEvening ||
    record.eyeBreaks > 0 ||
    record.hygieneDone,
  );
}

function buildTimeline(state: HealthLocalState, endDate: string) {
  const items: TimelineItem[] = [];

  for (const entry of state.growth) {
    if (entry.date > endDate) continue;
    items.push({
      id: `growth:${entry.id}`,
      date: entry.date,
      kind: "growth",
      title: "Mốc tăng trưởng",
      detail: `${entry.heightCm} cm · ${entry.weightKg} kg`,
      meta: "Số đo đã lưu trên thiết bị",
    });
  }

  for (const [date, record] of Object.entries(state.days)) {
    if (date > endDate) continue;

    if (record.symptoms.length) {
      items.push({
        id: `symptom:${date}`,
        date,
        kind: "symptom",
        title: "Triệu chứng đã ghi",
        detail: record.symptoms.join(" · "),
        meta: "Bản ghi mô tả, không phải chẩn đoán",
      });
    }

    const journalText = record.journalNote.trim();
    if (record.feeling || journalText) {
      const feeling = record.feeling ? FEELING_LABELS[record.feeling] : "";
      items.push({
        id: `journal:${date}`,
        date,
        kind: "journal",
        title: "Nhật ký sức khỏe",
        detail: [feeling, journalText].filter(Boolean).join(" · ").slice(0, 360),
        meta: journalText.length > 360 ? "Ghi chú được rút gọn trong dòng thời gian" : undefined,
      });
    }

    if (hasCare(record)) {
      items.push({
        id: `care:${date}`,
        date,
        kind: "care",
        title: "Chăm sóc đã ghi",
        detail: careDetail(record),
      });
    }

    if (record.activities.length) {
      const totalMinutes = record.activities.reduce((sum, entry) => sum + entry.minutes, 0);
      const types = [...new Set(record.activities.map((entry) => entry.type))];
      items.push({
        id: `activity:${date}`,
        date,
        kind: "activity",
        title: "Vận động đã ghi",
        detail: `${totalMinutes} phút · ${types.join(" · ")}`,
        meta: "Không quy đổi thành calo hoặc điểm thể lực",
      });
    }

    if (record.meals.length || record.foodGroups.length || record.waterCups > 0) {
      const parts: string[] = [];
      if (record.foodGroups.length) parts.push(`${record.foodGroups.length} nhóm thực phẩm`);
      if (record.meals.length) parts.push(`${record.meals.length} bản ghi bữa ăn`);
      if (record.waterCups > 0) parts.push(`${record.waterCups} cốc nước đã ghi`);
      items.push({
        id: `nutrition:${date}`,
        date,
        kind: "nutrition",
        title: "Dinh dưỡng đã ghi",
        detail: parts.join(" · "),
        meta: "Không tính calo hoặc chấm điểm chế độ ăn",
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind));
}

export default function HealthTimeline({ state, endDate }: { state: HealthLocalState; endDate: string }) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [range, setRange] = useState<TimelineRange>("30d");

  const allItems = useMemo(() => buildTimeline(state, endDate), [state, endDate]);
  const visibleItems = useMemo(() => {
    const startDate = range === "30d" ? shiftDateKey(endDate, -29) : range === "90d" ? shiftDateKey(endDate, -89) : null;
    return allItems.filter((item) => {
      if (filter !== "all" && item.kind !== filter) return false;
      return startDate ? item.date >= startDate : true;
    });
  }, [allItems, endDate, filter, range]);

  const shownItems = visibleItems.slice(0, 120);
  const dayCount = new Set(visibleItems.map((item) => item.date)).size;
  const growthCount = visibleItems.filter((item) => item.kind === "growth").length;
  const symptomCount = visibleItems.filter((item) => item.kind === "symptom").length;

  return <section className="health-timeline-card" aria-labelledby="health-timeline-title">
    <header className="health-timeline-head">
      <div>
        <span className="hf-kicker">Dòng thời gian local-first</span>
        <h3 id="health-timeline-title">Dòng thời gian sức khỏe</h3>
        <p>Gom các mốc đã ghi để nhìn diễn biến theo thời gian. Dữ liệu thiếu không được xem là sức khỏe xấu và dòng thời gian không tự chẩn đoán.</p>
      </div>
      <small>Kết thúc tại {formatDate(endDate)}</small>
    </header>

    <div className="health-timeline-controls">
      <div className="health-timeline-filter" aria-label="Lọc loại sự kiện">
        <button type="button" className={filter === "all" ? "is-selected" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Tất cả</button>
        {(Object.entries(KIND_LABELS) as [HealthTimelineKind, string][]).map(([kind, label]) => <button type="button" key={kind} className={filter === kind ? "is-selected" : ""} aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{label}</button>)}
      </div>
      <div className="health-timeline-range" aria-label="Khoảng thời gian">
        {([['30d', '30 ngày'], ['90d', '90 ngày'], ['all', 'Toàn bộ']] as const).map(([value, label]) => <button type="button" key={value} className={range === value ? "is-selected" : ""} aria-pressed={range === value} onClick={() => setRange(value)}>{label}</button>)}
      </div>
    </div>

    <div className="health-timeline-metrics">
      <article><span>Sự kiện đã ghi</span><strong>{visibleItems.length}</strong><small>Trong bộ lọc hiện tại</small></article>
      <article><span>Ngày có dữ liệu</span><strong>{dayCount}</strong><small>Không suy diễn từ ngày trống</small></article>
      <article><span>Mốc tăng trưởng</span><strong>{growthCount}</strong><small>Số đo chiều cao/cân nặng</small></article>
      <article><span>Ngày có triệu chứng ghi</span><strong>{symptomCount}</strong><small>Không phải số ca bệnh</small></article>
    </div>

    {shownItems.length ? <div className="health-timeline-list">
      {shownItems.map((item) => <article className={`health-timeline-item is-${item.kind}`} key={item.id}>
        <div className="health-timeline-marker" aria-hidden="true" />
        <div className="health-timeline-date"><time dateTime={item.date}>{formatDate(item.date)}</time><span>{KIND_LABELS[item.kind]}</span></div>
        <div className="health-timeline-copy"><strong>{item.title}</strong><p>{item.detail}</p>{item.meta ? <small>{item.meta}</small> : null}</div>
      </article>)}
    </div> : <div className="health-timeline-empty">Chưa có bản ghi phù hợp với bộ lọc và khoảng thời gian này.</div>}

    {visibleItems.length > shownItems.length ? <p className="health-timeline-limit">Đang hiển thị 120 sự kiện mới nhất trong bộ lọc để giữ giao diện nhẹ.</p> : null}
    <div className="health-timeline-safety"><strong>Ranh giới:</strong> Dòng thời gian chỉ tổng hợp dữ liệu đã nhập trên thiết bị. Không tạo điểm sức khỏe tổng, không tự kết luận nguyên nhân triệu chứng và không gửi nội dung này sang Trung tâm Quản trị.</div>
  </section>;
}
