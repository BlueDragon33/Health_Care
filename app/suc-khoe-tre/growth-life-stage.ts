import type { HealthLifeStage } from "./health-age-scope";
import { formatAgeMonths } from "./who-bmi-reference";

export type GrowthStageConfig = {
  statureLabel: string;
  staturePlaceholder: string;
  weightPlaceholder: string;
  measurementHint: string;
};

export type GrowthTimelinePresentation = {
  metricLabel: string;
  detail: string;
  useWhoBmiReference: boolean;
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

  if (ageMonths !== null && ageMonths < 108) {
    return {
      value: "5–8",
      label: "Theo dõi số đo",
      detail: "WHO Reference 2007 có phạm vi 5–19 tuổi, nhưng bảng LMS đã kiểm định trong ứng dụng hiện mới tích hợp từ 9 tuổi. Nhóm 5–8 tuổi chỉ hiển thị xu hướng số đo, không tự nội suy BMI-for-age.",
    };
  }

  return {
    value: bmi === null ? "—" : bmi.toFixed(1),
    label: "BMI",
    detail: "BMI chỉ được diễn giải theo tuổi và giới khi mốc đo nằm trong bảng WHO 2007 đã tích hợp của ứng dụng (9 tuổi đến hết 18 tuổi).",
  };
}

export function growthTimelinePresentation(ageMonths: number | null, bmi: number | null): GrowthTimelinePresentation {
  if (ageMonths === null) {
    return {
      metricLabel: "Tuổi chưa xác định",
      detail: "Cần ngày sinh hợp lệ để xác định tuổi tại chính ngày đo.",
      useWhoBmiReference: false,
    };
  }

  if (ageMonths < 24) {
    return {
      metricLabel: "Chiều dài / cân nặng",
      detail: `${formatAgeMonths(ageMonths)} · WHO 0–5 · không phân loại bằng BMI-for-age 5–19`,
      useWhoBmiReference: false,
    };
  }

  if (ageMonths < 60) {
    return {
      metricLabel: "Chiều cao / cân nặng",
      detail: `${formatAgeMonths(ageMonths)} · WHO 0–5 · không phân loại bằng BMI-for-age 5–19`,
      useWhoBmiReference: false,
    };
  }

  if (ageMonths < 108) {
    return {
      metricLabel: "Chiều cao / cân nặng",
      detail: `${formatAgeMonths(ageMonths)} · chỉ theo dõi xu hướng; bảng LMS định lượng 5–8 tuổi chưa được tích hợp/kiểm định trong ứng dụng`,
      useWhoBmiReference: false,
    };
  }

  if (ageMonths > 227) {
    return {
      metricLabel: "Chiều cao / cân nặng",
      detail: `${formatAgeMonths(ageMonths)} · ngoài phạm vi sản phẩm đến hết 18 tuổi 11 tháng`,
      useWhoBmiReference: false,
    };
  }

  return {
    metricLabel: `BMI ${bmi === null ? "—" : bmi.toFixed(1)}`,
    detail: `${formatAgeMonths(ageMonths)} · WHO BMI-for-age 2007`,
    useWhoBmiReference: true,
  };
}
