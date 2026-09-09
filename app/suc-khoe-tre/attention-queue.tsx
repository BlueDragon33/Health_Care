"use client";

import { useMemo, useState } from "react";
import {
  currentDay,
  recentDateKeys,
  todayKey,
  type DailyRecord,
  type GrowthEntry,
  type HealthLocalState,
  type Reminder,
} from "./health-local-store";
import { buildOperationalAttentionSnapshot, operationalCompleteness } from "./health-attention-engine";
import { nextReminderOccurrence } from "./health-reminders";
import { profileAgeScope, type HealthLifeStageId } from "./health-age-scope";
import { assessWhoBmiForAge, calculateBmi } from "./who-bmi-reference";
import AgeContentCenter from "./age-content-center";

export type AttentionNavigationTarget = "profile" | "growth" | "nutrition" | "activity" | "care" | "journal";
type GrowthRange = "3m" | "6m" | "1y" | "all";

type RecentItem = {
  id: string;
  kind: "nutrition" | "activity" | "care" | "growth" | "journal" | "symptom";
  title: string;
  detail: string;
  date: string;
};

const LIFE_STAGE_BUTTONS: readonly { id: HealthLifeStageId; label: string }[] = [
  { id: "infant-9-11m", label: "9–11 tháng" },
  { id: "toddler-12-23m", label: "12–23 tháng" },
  { id: "early-childhood-2-5y", label: "2–5 tuổi" },
  { id: "school-age-6-8y", label: "6–8 tuổi" },
  { id: "foundation", label: "9–10 tuổi" },
  { id: "preteen", label: "11–12 tuổi" },
  { id: "early-adolescent", label: "13–15 tuổi" },
  { id: "late-adolescent", label: "16–18 tuổi" },
] as const;

const kindLabels: Record<RecentItem["kind"], string> = {
  nutrition: "Dinh dưỡng",
  activity: "Vận động",
  care: "Chăm sóc",
  growth: "Tăng trưởng",
  journal: "Nhật ký",
  symptom: "Triệu chứng",
};

function targetFor(domainId: string): AttentionNavigationTarget {
  return domainId === "growth-development" ? "growth" : "profile";
}

function priorityLabel(priority: "info" | "due" | "review" | "urgent") {
  if (priority === "due") return "Đến hạn";
  if (priority === "review") return "Cần xem";
  if (priority === "urgent") return "Khẩn";
  return "Bổ sung";
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date)
    : value;
}

function formatReminderDate(value: Date | null) {
  if (!value) return "Chưa có lịch";
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(value);
}

function hasCare(record: DailyRecord) {
  return Boolean(
    record.sleepStart || record.sleepEnd || record.tasks.teethMorning || record.tasks.teethEvening || record.hygieneDone || record.eyeBreaks > 0,
  );
}

function dateCutoff(endDate: string, months: number) {
  const end = new Date(`${endDate}T12:00:00`);
  if (!Number.isFinite(end.getTime())) return "0000-00-00";
  end.setMonth(end.getMonth() - months);
  return end.toISOString().slice(0, 10);
}

function growthRange(entries: GrowthEntry[], endDate: string, range: GrowthRange) {
  const start = range === "3m" ? dateCutoff(endDate, 3) : range === "6m" ? dateCutoff(endDate, 6) : range === "1y" ? dateCutoff(endDate, 12) : "0000-00-00";
  return entries
    .filter((entry) => entry.date <= endDate && entry.date >= start)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function linePoints(values: number[], width = 144, height = 44) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(0.1, max - min);
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - 5 - ((value - min) / spread) * (height - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function MiniChart({ values, tone, label }: { values: number[]; tone: "blue" | "green" | "violet"; label: string }) {
  const points = linePoints(values);
  return <div className={`ref-mini-chart tone-${tone}`} aria-label={label}>
    <svg viewBox="0 0 144 44" role="img" aria-label={label}>
      <path d="M0 39H144" className="ref-chart-axis" />
      {points ? <polyline points={points} className="ref-chart-line" /> : null}
      {points ? points.split(" ").map((point) => {
        const [cx, cy] = point.split(",");
        return <circle key={point} cx={cx} cy={cy} r="2.5" className="ref-chart-point" />;
      }) : null}
    </svg>
  </div>;
}

function buildRecentItems(state: HealthLocalState, endDate: string) {
  const items: RecentItem[] = [];
  for (const entry of state.growth) {
    if (entry.date <= endDate) items.push({ id: `growth:${entry.id}`, kind: "growth", title: "Chiều cao / cân nặng", detail: `${entry.heightCm} cm · ${entry.weightKg} kg`, date: entry.date });
  }
  for (const [date, record] of Object.entries(state.days)) {
    if (date > endDate) continue;
    const meal = record.meals.at(-1);
    if (meal) items.push({ id: `meal:${meal.id}`, kind: "nutrition", title: "Bữa ăn", detail: meal.text, date });
    const activityMinutes = record.activities.reduce((sum, entry) => sum + entry.minutes, 0);
    if (activityMinutes) items.push({ id: `activity:${date}`, kind: "activity", title: "Vận động", detail: `${activityMinutes} phút · ${record.activities.map((entry) => entry.type).join(" · ")}`, date });
    if (record.sleepStart || record.sleepEnd) items.push({ id: `sleep:${date}`, kind: "care", title: "Giấc ngủ", detail: `${record.sleepStart || "—"} → ${record.sleepEnd || "—"}`, date });
    if (record.symptoms.length) items.push({ id: `symptom:${date}`, kind: "symptom", title: "Triệu chứng", detail: record.symptoms.join(" · "), date });
    if (record.journalNote.trim() || record.feeling) items.push({ id: `journal:${date}`, kind: "journal", title: "Nhật ký sức khỏe", detail: record.journalNote.trim() || (record.feeling === "good" ? "Khỏe" : record.feeling === "unwell" ? "Không khỏe" : "Bình thường"), date });
  }
  return items.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

function loggedPercent(days: DailyRecord[], predicate: (record: DailyRecord) => boolean) {
  return Math.round((days.filter(predicate).length / Math.max(1, days.length)) * 100);
}

export default function AttentionQueue({
  state,
  profileId,
  onNavigate,
}: {
  state: HealthLocalState;
  profileId: string;
  onNavigate: (target: AttentionNavigationTarget) => void;
}) {
  const snapshot = useMemo(() => buildOperationalAttentionSnapshot(state, profileId), [state, profileId]);
  const completeness = useMemo(() => operationalCompleteness(state), [state]);
  const [range, setRange] = useState<GrowthRange>("6m");
  const today = todayKey();
  const age = useMemo(() => profileAgeScope(state.profile.birthDate, today), [state.profile.birthDate, today]);
  const selectedGrowth = useMemo(() => growthRange(state.growth, today, range), [state.growth, today, range]);
  const latestGrowth = selectedGrowth.at(-1) ?? [...state.growth].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const latestAssessment = useMemo(() => latestGrowth ? assessWhoBmiForAge({
    birthDate: state.profile.birthDate,
    measurementDate: latestGrowth.date,
    sex: state.profile.sex,
    heightCm: latestGrowth.heightCm,
    weightKg: latestGrowth.weightKg,
  }) : null, [latestGrowth, state.profile.birthDate, state.profile.sex]);
  const recentKeys = useMemo(() => recentDateKeys(7, today), [today]);
  const recentDays = useMemo(() => recentKeys.map((key) => currentDay(state, key)), [recentKeys, state]);
  const recentItems = useMemo(() => buildRecentItems(state, today), [state, today]);
  const reminders = useMemo(() => state.reminders
    .map((reminder) => ({ reminder, date: nextReminderOccurrence(reminder) }))
    .filter((item): item is { reminder: Reminder; date: Date } => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3), [state.reminders]);

  const nutritionPct = loggedPercent(recentDays, (record) => record.foodGroups.length > 0 || record.meals.length > 0 || record.waterCups > 0);
  const activityPct = loggedPercent(recentDays, (record) => record.activities.length > 0);
  const carePct = loggedPercent(recentDays, hasCare);
  const heights = selectedGrowth.map((entry) => entry.heightCm);
  const weights = selectedGrowth.map((entry) => entry.weightKg);
  const bmis = selectedGrowth.map((entry) => calculateBmi(entry.heightCm, entry.weightKg)).filter((value): value is number => value !== null);
  const isUnderFive = age.months !== null && age.months < 60;
  const activeStageId = age.lifeStage?.id ?? null;

  return <section className="reference-today-dashboard" aria-label="Dashboard Hôm nay">
    <section className="ref-age-scope" aria-label="Phạm vi tuổi của ứng dụng">
      <div className="ref-age-scope-copy">
        <span>Phạm vi đã cập nhật</span>
        <strong>Từ 9 tháng đến hết 18 tuổi</strong>
        <small>{age.lifeStage ? `Hồ sơ hiện tại: ${age.lifeStage.shortLabel}` : "Nhập ngày sinh để tự đánh dấu đúng giai đoạn."}</small>
      </div>
      <div className="ref-age-stage-row" role="list" aria-label="Các giai đoạn tuổi">
        {LIFE_STAGE_BUTTONS.map((stage) => <button key={stage.id} type="button" role="listitem" className={activeStageId === stage.id ? "is-active" : ""} aria-current={activeStageId === stage.id ? "true" : undefined}>{stage.label}</button>)}
      </div>
    </section>

    <div className="ref-dashboard-grid">
      <section className="ref-card ref-attention-card">
        <header className="ref-card-head"><div><span className="ref-card-icon">!</span><h3>Việc cần chú ý hôm nay</h3><b>{snapshot.attention.length}</b></div><button type="button" onClick={() => onNavigate("profile")}>Xem tất cả →</button></header>
        <div className="ref-attention-list">
          {snapshot.attention.slice(0, 3).map((item) => <article key={item.id} className={`priority-${item.priority}`}>
            <span className="ref-item-dot" />
            <div><strong>{item.title}</strong><small>{item.summary || priorityLabel(item.priority)}</small></div>
            <button type="button" onClick={() => onNavigate(targetFor(item.domainId))}>{item.source === "user-reminder" ? "Mở" : "Bổ sung"}</button>
          </article>)}
          {!snapshot.attention.length ? <div className="ref-empty-line"><strong>Chưa có việc cần xử lý từ dữ liệu hiện có.</strong><small>Ngày trống không được hiểu là sức khỏe xấu.</small></div> : null}
        </div>
        <div className="ref-completeness"><span>Hồ sơ nền</span><div><i style={{ width: `${(completeness.completed / Math.max(1, completeness.total)) * 100}%` }} /></div><strong>{completeness.completed}/{completeness.total}</strong></div>
      </section>

      <section className="ref-card ref-growth-card">
        <header className="ref-card-head"><div><span className="ref-card-icon">↗</span><h3>Tăng trưởng</h3></div><div className="ref-range-tabs" role="tablist" aria-label="Khoảng biểu đồ tăng trưởng">
          {([['3m', '3 tháng'], ['6m', '6 tháng'], ['1y', '1 năm'], ['all', 'Toàn bộ']] as const).map(([value, label]) => <button type="button" role="tab" key={value} aria-selected={range === value} className={range === value ? "is-active" : ""} onClick={() => setRange(value)}>{label}</button>)}
        </div></header>
        <div className="ref-growth-metrics">
          <article><span>Chiều cao</span><strong>{latestGrowth ? `${latestGrowth.heightCm}` : "—"}<small> cm</small></strong><MiniChart values={heights} tone="blue" label="Xu hướng chiều cao" /></article>
          <article><span>Cân nặng</span><strong>{latestGrowth ? `${latestGrowth.weightKg}` : "—"}<small> kg</small></strong><MiniChart values={weights} tone="green" label="Xu hướng cân nặng" /></article>
          <article><span>{isUnderFive ? "Chuẩn tuổi" : "BMI (z-score)"}</span><strong>{isUnderFive ? "WHO 0–5" : latestAssessment?.available ? `${latestAssessment.zScore >= 0 ? "+" : ""}${latestAssessment.zScore.toFixed(2)}` : "—"}</strong><MiniChart values={bmis} tone="violet" label="Xu hướng BMI thô" /></article>
        </div>
        <footer><small>{isUnderFive ? "Trẻ dưới 5 tuổi: không dùng WHO BMI-for-age 5–19 để phân loại. Số đo vẫn được theo dõi và phần chuẩn 0–5 được tách riêng." : latestAssessment?.available ? `${latestAssessment.categoryLabel} · WHO Reference 2007` : "Thêm ngày sinh, giới tính và số đo để có tham chiếu WHO phù hợp."}</small><button type="button" onClick={() => onNavigate("growth")}>Xem chi tiết tăng trưởng →</button></footer>
      </section>

      <aside className="ref-right-stack">
        <section className="ref-card ref-week-summary">
          <header className="ref-card-head"><div><span className="ref-card-icon">▥</span><h3>Tổng hợp 7 ngày</h3></div><span className="ref-muted-label">Mức ghi nhận</span></header>
          <div className="ref-summary-bars">
            <article><span>Dinh dưỡng</span><div><i style={{ width: `${nutritionPct}%` }} /></div><strong>{nutritionPct}%</strong></article>
            <article><span>Vận động</span><div><i style={{ width: `${activityPct}%` }} /></div><strong>{activityPct}%</strong></article>
            <article><span>Chăm sóc</span><div><i style={{ width: `${carePct}%` }} /></div><strong>{carePct}%</strong></article>
          </div>
          <small>Phần trăm chỉ phản ánh số ngày có ghi dữ liệu, không phải điểm sức khỏe.</small>
        </section>

        <section className="ref-card ref-reminders-card">
          <header className="ref-card-head"><div><span className="ref-card-icon">◔</span><h3>Nhắc nhở sắp tới</h3></div><button type="button" onClick={() => onNavigate("profile")}>Xem tất cả →</button></header>
          <div className="ref-reminder-list">
            {reminders.map(({ reminder, date }) => <article key={reminder.id}><span className={`ref-reminder-icon cat-${reminder.category}`}>•</span><div><strong>{reminder.title}</strong><small>{formatReminderDate(date)}</small></div></article>)}
            {!reminders.length ? <div className="ref-empty-line"><strong>Chưa có nhắc việc.</strong><small>Tạo trong Hồ sơ → Lịch & nhắc việc.</small></div> : null}
          </div>
        </section>
      </aside>

      <section className="ref-card ref-recent-card">
        <header className="ref-card-head"><div><span className="ref-card-icon">◫</span><h3>Nhật ký gần đây</h3></div><button type="button" onClick={() => onNavigate("journal")}>Xem tất cả →</button></header>
        <div className="ref-recent-list">
          {recentItems.slice(0, 4).map((item) => <article key={item.id}><span className={`ref-log-icon kind-${item.kind}`}>•</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><time>{formatShortDate(item.date)}</time></article>)}
          {!recentItems.length ? <div className="ref-empty-line"><strong>Chưa có nhật ký gần đây.</strong><small>Các bản ghi mới sẽ xuất hiện tại đây.</small></div> : null}
        </div>
      </section>

      <section className="ref-card ref-timeline-card">
        <header className="ref-card-head"><div><span className="ref-card-icon">⌁</span><h3>Dòng thời gian sức khỏe</h3></div><button type="button" onClick={() => onNavigate("journal")}>Xem toàn bộ →</button></header>
        <div className="ref-timeline-filter" aria-label="Nhóm dữ liệu"><span className="is-active">Tất cả</span><span>Tăng trưởng</span><span>Dinh dưỡng</span><span>Vận động</span><span>Chăm sóc</span></div>
        <div className="ref-timeline-list">
          {recentItems.slice(0, 4).map((item, index) => <article key={`timeline:${item.id}`}><div className="ref-timeline-rail"><i className={`kind-${item.kind}`} />{index < Math.min(3, recentItems.length - 1) ? <b /> : null}</div><div><strong>{item.title}</strong><small>{item.detail}</small></div><time>{formatShortDate(item.date)}</time></article>)}
          {!recentItems.length ? <div className="ref-empty-line"><strong>Dòng thời gian đang trống.</strong><small>Thêm bữa ăn, vận động, giấc ngủ hoặc số đo để bắt đầu.</small></div> : null}
        </div>
      </section>

      <section className="ref-card ref-quote-card">
        <div className="ref-quote-sun">♡</div>
        <blockquote>“Sức khỏe tốt là hành trang đẹp nhất cho những giấc mơ lớn.”</blockquote>
        <div className="ref-signposts"><span>KHỎE MẠNH</span><span>TỰ TIN</span><span>HẠNH PHÚC</span><span>TƯƠNG LAI</span></div>
      </section>
    </div>

    <details className="ref-age-content-details">
      <summary><span>Cẩm nang theo tuổi</span><strong>9 tháng → 18 tuổi</strong><small>Mở nội dung chi tiết theo từng giai đoạn</small></summary>
      <AgeContentCenter ageMonths={age.months} sex={state.profile.sex} />
    </details>

    <p className="ref-dashboard-boundary">Dashboard chỉ tổng hợp dữ liệu đã lưu trên thiết bị. Không tạo điểm sức khỏe tổng, không tự chẩn đoán và không gửi hồ sơ sức khỏe sang Application Management.</p>
  </section>;
}
