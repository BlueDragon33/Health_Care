import type { HealthLifeStage } from "./health-age-scope";

export type GrowthStageConfig = {
  statureLabel: string;
  staturePlaceholder: string;
  weightPlaceholder: string;
  measurementHint: string;
};

const DEFAULT_GROWTH_STAGE: GrowthStageConfig = {
  statureLabel: "Chiều cao (cm)",
  staturePlaceholder: "Nhập số đo thực tế",
  weightPlaceholder: "Nhập cân nặng thực tế",
  measurementHint: "Ghi số đo thực tế tại thời điểm đo. Các mốc dùng để theo dõi xu hướng, không tự tạo chẩn đoán.",
};

const GROWTH_STAGE_CONFIG: Record<string, GrowthStageConfig> = {
  "infant-9-11m": {
    statureLabel: "Chiều dài nằm (cm)",
    staturePlaceholder: "Nhập chiều dài đo được",
    weightPlaceholder: "Nhập cân nặng đo được",
    measurementHint: "Ở giai đoạn này ưu tiên ghi chiều dài nằm và cân nặng thực tế. Ứng dụng không dùng BMI-for-age 5–19 để phân loại trẻ dưới 5 tuổi.",
  },
  "toddler-12-23m": {
    statureLabel: "Chiều dài nằm (cm)",
    staturePlaceholder: "Nhập chiều dài đo được",
    weightPlaceholder: "Nhập cân nặng đo được",
    measurementHint: "Trẻ dưới 2 tuổi thường được theo dõi bằng chiều dài nằm. Hãy ghi đúng cách đo đã thực hiện để so sánh xu hướng nhất quán.",
  },
  "early-childhood-2-5y": {
    statureLabel: "Chiều cao đứng (cm)",
    staturePlaceholder: "Nhập chiều cao đo được",
    weightPlaceholder: "Nhập cân nặng đo được",
    measurementHint: "Từ 2 tuổi có thể ghi chiều cao đứng. Trẻ dưới 5 tuổi vẫn không dùng bảng BMI-for-age 5–19 của ứng dụng để phân loại.",
  },
  "school-age-6-8y": DEFAULT_GROWTH_STAGE,
  foundation: DEFAULT_GROWTH_STAGE,
  preteen: DEFAULT_GROWTH_STAGE,
  "early-adolescent": DEFAULT_GROWTH_STAGE,
  "late-adolescent": DEFAULT_GROWTH_STAGE,
};

export function growthConfigForLifeStage(stage: HealthLifeStage | null): GrowthStageConfig {
  if (!stage) return DEFAULT_GROWTH_STAGE;
  return GROWTH_STAGE_CONFIG[stage.id] ?? DEFAULT_GROWTH_STAGE;
}

export function growthSummaryMetric(ageMonths: number | null, bmi: number | null) {
  if (ageMonths !== null && ageMonths < 60) {
    return {
      value: "0–5",
      label: "WHO trẻ nhỏ",
      detail: "Không hiển thị BMI như chỉ số phân loại cho hồ sơ dưới 5 tuổi.",
    };
  }

  return {
    value: bmi === null ? "—" : bmi.toFixed(1),
    label: "BMI",
    detail: "BMI chỉ được diễn giải theo tuổi và giới khi hồ sơ nằm trong phạm vi WHO 5–19 của ứng dụng.",
  };
}
