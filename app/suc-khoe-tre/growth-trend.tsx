"use client";

import { useMemo, useState } from "react";
import { todayKey, type GrowthEntry, type HealthProfile } from "./health-local-store";
import { assessWhoBmiForAge, completedAgeMonths, formatAgeMonths } from "./who-bmi-reference";

export type GrowthTrendRange = "3m" | "6m" | "1y" | "all";
export type GrowthTrendMetric = "height" | "weight" | "bmi-z";

type ChartPoint = {
  id: string;
  date: string;
  value: number;
  label: string;
  detail: string;
};

const RANGE_OPTIONS: { id: GrowthTrendRange; label: string; months: number | null }[] = [
  { id: "3m", label: "3 tháng", months: 3 },
  { id: "6m", label: "6 tháng", months: 6 },
  { id: "1y", label: "1 năm", months: 12 },
  { id: "all", label: "Toàn bộ", months: null },
];

function dateMs(value: string) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function subtractCalendarMonths(value: string, months: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const first = new Date(Date.UTC(year, monthIndex - months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const result = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, lastDay)));
  return result.toISOString().slice(0, 10);
}

export function filterGrowthEntries(entries: GrowthEntry[], range: GrowthTrendRange) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (range === "all" || sorted.length === 0) return sorted;
  const option = RANGE_OPTIONS.find((item) => item.id === range);
  const anchor = sorted.at(-1)?.date;
  if (!anchor || !option?.months) return sorted;
  const cutoff = subtractCalendarMonths(anchor, option.months);
  return sorted.filter((entry) => entry.date >= cutoff);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
    : value;
}

function metricPoints(entries: GrowthEntry[], metric: GrowthTrendMetric, profile: HealthProfile): ChartPoint[] {
  if (metric === "height") {
    return entries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      value: entry.heightCm,
      label: `${entry.heightCm.toFixed(1)} cm`,
      detail: `${entry.weightKg.toFixed(1)} kg`,
    }));
  }
  if (metric === "weight") {
    return entries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      value: entry.weightKg,
      label: `${entry.weightKg.toFixed(1)} kg`,
      detail: `${entry.heightCm.toFixed(1)} cm`,
    }));
  }
  return entries.flatMap((entry) => {
    const assessment = assessWhoBmiForAge({
      birthDate: profile.birthDate,
      measurementDate: entry.date,
      sex: profile.sex,
      heightCm: entry.heightCm,
      weightKg: entry.weightKg,
    });
    if (!assessment.available) return [];
    return [{
      id: entry.id,
      date: entry.date,
      value: assessment.zScore,
      label: `z ${assessment.zScore >= 0 ? "+" : ""}${assessment.zScore.toFixed(2)}`,
      detail: `${formatAgeMonths(assessment.ageMonths)} · BMI ${assessment.bmi.toFixed(1)}`,
    }];
  });
}

function yDomain(points: ChartPoint[], metric: GrowthTrendMetric) {
  if (metric === "bmi-z") {
    const values = points.map((point) => point.value);
    const low = values.length ? Math.min(-4, Math.floor(Math.min(...values) - 0.5)) : -4;
    const high = values.length ? Math.max(3, Math.ceil(Math.max(...values) + 0.5)) : 3;
    return { min: Math.max(-8, low), max: Math.min(8, high) };
  }
  const values = points.map((point) => point.value);
  if (!values.length) return { min: 0, max: 1 };
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (low === high) {
    const pad = Math.max(metric === "height" ? 2 : 1, Math.abs(low) * 0.03);
    return { min: low - pad, max: high + pad };
  }
  const pad = Math.max((high - low) * 0.18, metric === "height" ? 1 : 0.5);
  return { min: Math.max(0, low - pad), max: high + pad };
}

function unitFor(metric: GrowthTrendMetric) {
  if (metric === "height") return "cm";
  if (metric === "weight") return "kg";
  return "z-score";
}

function metricTitle(metric: GrowthTrendMetric, statureTerm: string) {
  if (metric === "height") return `Xu hướng ${statureTerm.toLowerCase()} ghi nhận`;
  if (metric === "weight") return "Xu hướng cân nặng ghi nhận";
  return "Xu hướng BMI-for-age theo WHO 2007";
}

function rawOnlyReason(ageMonths: number | null) {
  if (ageMonths === null) return "Nhập ngày sinh hợp lệ để hệ thống xác định đúng chế độ biểu đồ theo tuổi.";
  if (ageMonths < 24) return "Hồ sơ dưới 2 tuổi ưu tiên xu hướng chiều dài nằm và cân nặng; biểu đồ BMI-for-age WHO không xuất hiện như một lựa chọn hợp lệ.";
  if (ageMonths < 60) return "Hồ sơ dưới 5 tuổi ưu tiên xu hướng chiều cao/cân nặng theo nền WHO Child Growth Standards 0–5; không dùng BMI-for-age 5–19 để phân loại.";
  if (ageMonths < 108) return "Nhóm 5–8 tuổi hiện chỉ hiển thị số đo thô. WHO Reference 2007 có dữ liệu cho nhóm này nhưng bảng LMS 61–107 tháng chưa được tích hợp/kiểm định trong ứng dụng, nên hệ thống không tự nội suy.";
  return "Hồ sơ đã ngoài phạm vi sản phẩm đến hết 18 tuổi 11 tháng; hệ thống không tự chuyển sang BMI người lớn.";
}

export default function GrowthTrend({ entries, profile }: { entries: GrowthEntry[]; profile: HealthProfile }) {
  const [range, setRange] = useState<GrowthTrendRange>("1y");
  const [metric, setMetric] = useState<GrowthTrendMetric>("height");
  const currentAgeMonths = useMemo(() => completedAgeMonths(profile.birthDate, todayKey()), [profile.birthDate]);
  const bmiMetricAllowed = currentAgeMonths !== null && currentAgeMonths >= 108 && currentAgeMonths <= 227;
  const statureTerm = currentAgeMonths !== null && currentAgeMonths < 24 ? "Chiều dài" : "Chiều cao";
  const metricOptions = useMemo<{ id: GrowthTrendMetric; label: string }[]>(() => [
    { id: "height", label: statureTerm },
    { id: "weight", label: "Cân nặng" },
    ...(bmiMetricAllowed ? [{ id: "bmi-z" as const, label: "BMI-for-age WHO" }] : []),
  ], [bmiMetricAllowed, statureTerm]);
  const effectiveMetric: GrowthTrendMetric = !bmiMetricAllowed && metric === "bmi-z" ? "height" : metric;
  const filtered = useMemo(() => filterGrowthEntries(entries, range), [entries, range]);
  const points = useMemo(() => metricPoints(filtered, effectiveMetric, profile), [filtered, effectiveMetric, profile]);
  const domain = useMemo(() => yDomain(points, effectiveMetric), [points, effectiveMetric]);

  const width = 760;
  const height = 300;
  const left = 58;
  const right = 24;
  const top = 24;
  const bottom = 48;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const times = points.map((point) => dateMs(point.date));
  const minTime = times.length ? Math.min(...times) : 0;
  const maxTime = times.length ? Math.max(...times) : 1;
  const spanTime = Math.max(1, maxTime - minTime);
  const spanY = Math.max(0.0001, domain.max - domain.min);
  const x = (time: number) => times.length <= 1 ? left + chartWidth / 2 : left + ((time - minTime) / spanTime) * chartWidth;
  const y = (value: number) => top + ((domain.max - value) / spanY) * chartHeight;
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(dateMs(point.date)).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const yTicks = Array.from({ length: 5 }, (_, index) => domain.max - (spanY * index) / 4);
  const thresholdLines = effectiveMetric === "bmi-z"
    ? [
      { value: -3, label: "−3 SD" },
      { value: -2, label: "−2 SD" },
      { value: 1, label: "+1 SD" },
      { value: 2, label: "+2 SD" },
    ].filter((item) => item.value >= domain.min && item.value <= domain.max)
    : [];

  const first = points[0] ?? null;
  const last = points.at(-1) ?? null;
  const delta = first && last && first.id !== last.id ? last.value - first.value : null;
  const unavailableBmi = effectiveMetric === "bmi-z" && filtered.length > 0 && points.length === 0;

  return <section className="growth-trend-card" aria-labelledby="growth-trend-title">
    <header className="growth-trend-head">
      <div>
        <span className="hf-kicker">Biểu đồ xu hướng</span>
        <h3 id="growth-trend-title">{metricTitle(effectiveMetric, statureTerm)}</h3>
        <p>Đường nối chỉ mô tả các mốc đã ghi nhận, không dự đoán chiều cao/cân nặng tương lai và không thay thế đánh giá lâm sàng.</p>
      </div>
      <div className="growth-trend-summary">
        <strong>{points.length}</strong><span>mốc hiển thị</span>
        {delta !== null ? <small>Thay đổi từ mốc đầu: {delta >= 0 ? "+" : ""}{delta.toFixed(effectiveMetric === "bmi-z" ? 2 : 1)} {unitFor(effectiveMetric)}</small> : null}
      </div>
    </header>

    <div className="growth-trend-controls" aria-label="Tùy chọn biểu đồ tăng trưởng">
      <div className="growth-trend-buttons" aria-label="Chỉ số">
        {metricOptions.map((option) => <button
          type="button"
          key={option.id}
          className={effectiveMetric === option.id ? "growth-3d-button is-selected" : "growth-3d-button"}
          aria-pressed={effectiveMetric === option.id}
          onClick={() => setMetric(option.id)}
        >{option.label}</button>)}
      </div>
      <div className="growth-trend-buttons growth-range-buttons" aria-label="Khoảng thời gian">
        {RANGE_OPTIONS.map((option) => <button
          type="button"
          key={option.id}
          className={range === option.id ? "growth-3d-button is-selected" : "growth-3d-button"}
          aria-pressed={range === option.id}
          onClick={() => setRange(option.id)}
        >{option.label}</button>)}
      </div>
    </div>

    {!bmiMetricAllowed ? <div className="growth-trend-warning">
      <strong>Biểu đồ đang ở chế độ số đo thô theo tuổi.</strong>
      <span>{rawOnlyReason(currentAgeMonths)}</span>
    </div> : null}

    {unavailableBmi ? <div className="growth-trend-warning">
      <strong>Chưa dựng được BMI-for-age WHO.</strong>
      <span>Cần giới tính trong Hồ sơ và mốc đo hợp lệ trong phạm vi 9 tuổi 0 tháng đến hết 18 tuổi 11 tháng. Chiều cao và cân nặng thô vẫn xem được.</span>
    </div> : null}

    {points.length ? <>
      <div className="growth-chart-scroll">
        <svg className="growth-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metricTitle(effectiveMetric, statureTerm)}, ${points.length} mốc từ ${formatDate(points[0].date)} đến ${formatDate(points.at(-1)!.date)}`}>
          {yTicks.map((tick) => <g key={tick}>
            <line className="growth-grid-line" x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} />
            <text className="growth-axis-label" x={left - 10} y={y(tick) + 4} textAnchor="end">{tick.toFixed(effectiveMetric === "bmi-z" ? 1 : 0)}</text>
          </g>)}
          {thresholdLines.map((item) => <g key={item.value}>
            <line className="growth-threshold-line" x1={left} x2={width - right} y1={y(item.value)} y2={y(item.value)} />
            <text className="growth-threshold-label" x={width - right - 4} y={y(item.value) - 5} textAnchor="end">{item.label}</text>
          </g>)}
          <line className="growth-axis" x1={left} x2={left} y1={top} y2={height - bottom} />
          <line className="growth-axis" x1={left} x2={width - right} y1={height - bottom} y2={height - bottom} />
          {points.length > 1 ? <path className="growth-line" d={path} fill="none" /> : null}
          {points.map((point) => <g key={point.id}>
            <circle className="growth-point" cx={x(dateMs(point.date))} cy={y(point.value)} r="5"><title>{formatDate(point.date)} · {point.label} · {point.detail}</title></circle>
          </g>)}
          <text className="growth-axis-label" x={left} y={height - 18}>{formatDate(points[0].date)}</text>
          {points.length > 1 ? <text className="growth-axis-label" x={width - right} y={height - 18} textAnchor="end">{formatDate(points.at(-1)!.date)}</text> : null}
          <text className="growth-axis-title" x={16} y={top + chartHeight / 2} transform={`rotate(-90 16 ${top + chartHeight / 2})`} textAnchor="middle">{unitFor(effectiveMetric)}</text>
        </svg>
      </div>
      {effectiveMetric === "bmi-z" ? <div className="growth-threshold-note"><strong>Đường tham chiếu WHO:</strong><span>−3 SD gầy nghiêm trọng · −2 SD gầy · +1 SD thừa cân · +2 SD béo phì. Đây là ngưỡng tham chiếu tăng trưởng, không phải chẩn đoán bệnh.</span></div> : <div className="growth-threshold-note"><strong>Số đo thô:</strong><span>Biểu đồ này chỉ cho thấy thay đổi chiều dài/chiều cao hoặc cân nặng theo các lần đo. Không gắn percentile hay phân loại lâm sàng khi chưa có bộ tham chiếu tương ứng đã được kiểm chứng.</span></div>}
      <div className="growth-point-list" aria-label="Các mốc đang hiển thị">
        {points.map((point) => <article key={point.id}><strong>{formatDate(point.date)}</strong><span>{point.label}</span><small>{point.detail}</small></article>)}
      </div>
    </> : <div className="growth-trend-empty">Chưa có đủ mốc phù hợp trong khoảng thời gian đã chọn.</div>}
  </section>;
}
