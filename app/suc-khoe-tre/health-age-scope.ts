import { completedAgeMonths, formatAgeMonths } from "./who-bmi-reference";

export type HealthAgeStageId = "foundation" | "preteen" | "early-adolescent" | "late-adolescent";
export type HealthLifeStageId = "infant-9-11m" | "toddler-12-23m" | "early-childhood-2-5y" | "school-age-6-8y" | HealthAgeStageId;

export type HealthAgeStage = {
  id: HealthAgeStageId;
  label: string;
  shortLabel: string;
  minMonths: number;
  maxMonths: number;
  focus: readonly string[];
};

export type HealthLifeStage = {
  id: HealthLifeStageId;
  label: string;
  shortLabel: string;
  minMonths: number;
  maxMonths: number;
  focus: readonly string[];
};

export const HEALTH_AGE_STAGES: readonly HealthAgeStage[] = [
  {
    id: "foundation",
    label: "9–10 tuổi · Nền tảng thói quen",
    shortLabel: "9–10 tuổi",
    minMonths: 108,
    maxMonths: 131,
    focus: ["ăn uống & nước", "vận động", "giấc ngủ", "răng miệng & vệ sinh", "mắt, tư thế & học đường", "an toàn cá nhân", "cảm xúc cơ bản", "chuẩn bị kiến thức thay đổi cơ thể"],
  },
  {
    id: "preteen",
    label: "11–12 tuổi · Tiền dậy thì",
    shortLabel: "11–12 tuổi",
    minMonths: 132,
    maxMonths: 155,
    focus: ["thay đổi cơ thể", "vệ sinh tuổi dậy thì", "dinh dưỡng tăng trưởng", "vận động & ngủ", "cảm xúc & quan hệ bạn bè", "an toàn & bắt nạt", "sức khỏe số", "ranh giới cá nhân"],
  },
  {
    id: "early-adolescent",
    label: "13–15 tuổi · Vị thành niên sớm",
    shortLabel: "13–15 tuổi",
    minMonths: 156,
    maxMonths: 191,
    focus: ["tăng trưởng tuổi dậy thì", "sức khỏe tinh thần", "dinh dưỡng & hình ảnh cơ thể", "vận động & giấc ngủ", "sức khỏe số", "quan hệ & đồng thuận", "phòng tránh chất gây nghiện/nguy cơ", "tăng dần năng lực tự chăm sóc"],
  },
  {
    id: "late-adolescent",
    label: "16–18 tuổi · Vị thành niên muộn / chuẩn bị đại học",
    shortLabel: "16–18 tuổi",
    minMonths: 192,
    maxMonths: 227,
    focus: ["tự quản lý sức khỏe", "hồ sơ, thuốc & dị ứng", "lịch khám & tài liệu", "giấc ngủ & stress học tập", "sức khỏe tinh thần", "quan hệ an toàn & sức khỏe sinh sản", "thông tin khẩn cấp khi sống xa nhà", "chuyển tiếp sang chăm sóc người lớn"],
  },
] as const;

const EARLY_LIFE_STAGES: readonly HealthLifeStage[] = [
  {
    id: "infant-9-11m",
    label: "9–11 tháng · Ăn dặm, vận động & an toàn",
    shortLabel: "9–11 tháng",
    minMonths: 9,
    maxMonths: 11,
    focus: ["sữa mẹ/sữa công thức và ăn dặm", "tăng dần độ thô", "ngủ 12–16 giờ/24 giờ", "răng đầu tiên & fluoride", "mốc phát triển 9–12 tháng", "phòng hóc/ngã/bỏng/đuối nước", "theo dõi dấu hiệu bệnh cần khám"],
  },
  {
    id: "toddler-12-23m",
    label: "12–23 tháng · Tập đi, ngôn ngữ & tự ăn",
    shortLabel: "12–23 tháng",
    minMonths: 12,
    maxMonths: 23,
    focus: ["ăn đa dạng và chống hóc", "tập cốc/thìa", "đi, chạy và vận động", "ngôn ngữ & tương tác", "ngủ 11–14 giờ/24 giờ", "răng miệng", "an toàn trong nhà và ngoài trời"],
  },
  {
    id: "early-childhood-2-5y",
    label: "2–5 tuổi · Phát triển, tự lập & chuẩn bị đi học",
    shortLabel: "2–5 tuổi",
    minMonths: 24,
    maxMonths: 71,
    focus: ["bữa ăn gia đình đa dạng", "mốc phát triển 2–5 tuổi", "ngủ 10–14 giờ tùy tuổi", "chải răng có người lớn hỗ trợ", "vận động & chơi", "màn hình có giới hạn", "chống hóc, nước, đường bộ, thuốc-hóa chất"],
  },
  {
    id: "school-age-6-8y",
    label: "6–8 tuổi · Nền tảng sức khỏe học đường",
    shortLabel: "6–8 tuổi",
    minMonths: 72,
    maxMonths: 107,
    focus: ["ăn sáng và bữa ăn cân bằng", "vận động hằng ngày", "ngủ đều", "răng miệng", "thị lực, tư thế & cặp sách", "an toàn giao thông/nước", "cảm xúc & kỹ năng xã hội", "chuẩn bị thay đổi cơ thể phù hợp tuổi"],
  },
] as const;

export const HEALTH_LIFE_STAGES: readonly HealthLifeStage[] = [
  ...EARLY_LIFE_STAGES,
  ...HEALTH_AGE_STAGES,
] as const;

export function healthAgeStageForMonths(months: number | null) {
  if (months === null) return null;
  return HEALTH_AGE_STAGES.find((stage) => months >= stage.minMonths && months <= stage.maxMonths) ?? null;
}

export function healthLifeStageForMonths(months: number | null) {
  if (months === null) return null;
  return HEALTH_LIFE_STAGES.find((stage) => months >= stage.minMonths && months <= stage.maxMonths) ?? null;
}

export function profileAgeScope(birthDate: string, atDate: string) {
  if (!birthDate) return { months: null, text: "Chưa có ngày sinh", inScope: null as boolean | null, stage: null as HealthAgeStage | null, lifeStage: null as HealthLifeStage | null };
  const months = completedAgeMonths(birthDate, atDate);
  if (months === null) return { months: null, text: "Ngày sinh chưa hợp lệ", inScope: null as boolean | null, stage: null as HealthAgeStage | null, lifeStage: null as HealthLifeStage | null };
  const stage = healthAgeStageForMonths(months);
  const lifeStage = healthLifeStageForMonths(months);
  return { months, text: formatAgeMonths(months), inScope: lifeStage !== null, stage, lifeStage };
}

export const HEALTH_AGE_SCOPE_GUARDRAILS = {
  continuousProductScopeMonths: [9, 227],
  earlyChildhoodRestored: true,
  noAdultBmiForUnder19: true,
  under5GrowthNeedsWhoChildGrowthStandard: true,
} as const;
