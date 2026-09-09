import type { HealthLifeStage, HealthLifeStageId } from "./health-age-scope";
import type { MealEntry } from "./health-local-store";

type MealSlotOption = {
  value: MealEntry["meal"];
  label: string;
  shortLabel: string;
};

type NutritionEntryPlan = {
  stageId: HealthLifeStageId;
  mealOptions: readonly MealSlotOption[];
  mealPlaceholder: string;
  showWaterCupTracker: boolean;
  fluidTitle: string;
  fluidHeading: string;
  fluidNote: string;
};

const infantMeals: readonly MealSlotOption[] = [
  { value: "breakfast", label: "Ăn bổ sung · lần 1", shortLabel: "Ăn lần 1" },
  { value: "lunch", label: "Ăn bổ sung · lần 2", shortLabel: "Ăn lần 2" },
  { value: "snack", label: "Ăn thêm / bữa phụ", shortLabel: "Ăn thêm" },
  { value: "dinner", label: "Ăn bổ sung · lần 3/4", shortLabel: "Ăn lần 3/4" },
] as const;

const toddlerMeals: readonly MealSlotOption[] = [
  { value: "breakfast", label: "Bữa đầu ngày", shortLabel: "Đầu ngày" },
  { value: "lunch", label: "Bữa giữa ngày", shortLabel: "Giữa ngày" },
  { value: "snack", label: "Bữa phụ", shortLabel: "Bữa phụ" },
  { value: "dinner", label: "Bữa chiều / tối", shortLabel: "Chiều / tối" },
] as const;

const childMeals: readonly MealSlotOption[] = [
  { value: "breakfast", label: "Bữa sáng", shortLabel: "Sáng" },
  { value: "lunch", label: "Bữa trưa", shortLabel: "Trưa" },
  { value: "snack", label: "Bữa phụ", shortLabel: "Bữa phụ" },
  { value: "dinner", label: "Bữa tối", shortLabel: "Tối" },
] as const;

export const NUTRITION_ENTRY_LIFE_STAGE_PLANS: Record<HealthLifeStageId, NutritionEntryPlan> = {
  "infant-9-11m": {
    stageId: "infant-9-11m",
    mealOptions: infantMeals,
    mealPlaceholder: "Ví dụ: cháo/cơm mềm và thực phẩm phù hợp trẻ đã ăn",
    showWaterCupTracker: false,
    fluidTitle: "Bú/sữa & chất lỏng",
    fluidHeading: "Không dùng bộ đếm cốc nước cho 9–11 tháng",
    fluidNote: "Ở giai đoạn này, ứng dụng không biến số cốc nước kiểu trẻ lớn thành mục tiêu bù nước. Theo dõi bú/sữa, ăn bổ sung và chất lỏng theo hướng dẫn phù hợp tuổi; khi trẻ ốm hoặc có vấn đề ăn/uống cần đánh giá theo tình trạng thực tế.",
  },
  "toddler-12-23m": {
    stageId: "toddler-12-23m",
    mealOptions: toddlerMeals,
    mealPlaceholder: "Ví dụ: cơm/cháo, đạm, rau hoặc món gia đình đã điều chỉnh phù hợp",
    showWaterCupTracker: true,
    fluidTitle: "Nước & đồ uống",
    fluidHeading: "Theo dõi cốc đã ghi",
    fluidNote: "Số cốc chỉ là đơn vị ghi nhanh; ứng dụng không tự đặt một mục tiêu lượng nước giống nhau cho mọi trẻ.",
  },
  "early-childhood-2-5y": {
    stageId: "early-childhood-2-5y",
    mealOptions: childMeals,
    mealPlaceholder: "Ví dụ: cơm, cá/thịt/đậu, rau, trái cây",
    showWaterCupTracker: true,
    fluidTitle: "Nước",
    fluidHeading: "Cốc đã ghi",
    fluidNote: "Số cốc chỉ để theo dõi thói quen; không tự suy ra nhu cầu nước cá nhân hoặc tình trạng mất nước.",
  },
  "school-age-6-8y": {
    stageId: "school-age-6-8y",
    mealOptions: childMeals,
    mealPlaceholder: "Ví dụ: cơm, cá, rau, cam",
    showWaterCupTracker: true,
    fluidTitle: "Nước",
    fluidHeading: "Cốc đã ghi",
    fluidNote: "Số cốc là nhật ký nhanh, không phải mục tiêu nước tự động cho mọi trẻ.",
  },
  foundation: {
    stageId: "foundation",
    mealOptions: childMeals,
    mealPlaceholder: "Ví dụ: cơm, cá, rau, trái cây",
    showWaterCupTracker: true,
    fluidTitle: "Nước",
    fluidHeading: "Cốc đã ghi",
    fluidNote: "Theo dõi để nhìn thói quen; không dùng số cốc như một chẩn đoán hoặc mục tiêu cố định cho mọi người.",
  },
  preteen: {
    stageId: "preteen",
    mealOptions: childMeals,
    mealPlaceholder: "Ví dụ: bữa chính hoặc bữa phụ đã ăn",
    showWaterCupTracker: true,
    fluidTitle: "Nước",
    fluidHeading: "Cốc đã ghi",
    fluidNote: "Theo dõi thói quen uống nước cùng lịch học/vận động; không tự áp một công thức lượng nước duy nhất.",
  },
  "early-adolescent": {
    stageId: "early-adolescent",
    mealOptions: childMeals,
    mealPlaceholder: "Ví dụ: món đã ăn trong bữa chính hoặc bữa phụ",
    showWaterCupTracker: true,
    fluidTitle: "Nước",
    fluidHeading: "Cốc đã ghi",
    fluidNote: "Nhật ký nước hỗ trợ quan sát thói quen, không dùng để siết cân, chấm điểm hoặc tự điều trị.",
  },
  "late-adolescent": {
    stageId: "late-adolescent",
    mealOptions: childMeals,
    mealPlaceholder: "Ví dụ: món đã ăn trong lịch học/làm việc hôm nay",
    showWaterCupTracker: true,
    fluidTitle: "Nước",
    fluidHeading: "Cốc đã ghi",
    fluidNote: "Dùng như nhật ký tự quản lý; nhu cầu cụ thể còn phụ thuộc bối cảnh và không được suy ra chỉ từ số cốc.",
  },
};

const fallbackPlan: NutritionEntryPlan = {
  stageId: "foundation",
  mealOptions: childMeals,
  mealPlaceholder: "Ví dụ: món đã ăn",
  showWaterCupTracker: true,
  fluidTitle: "Nước",
  fluidHeading: "Cốc đã ghi",
  fluidNote: "Nhập ngày sinh trong Hồ sơ để form Dinh dưỡng đổi theo giai đoạn tuổi.",
};

export function nutritionEntryPlanForLifeStage(stage: HealthLifeStage | null) {
  return stage ? NUTRITION_ENTRY_LIFE_STAGE_PLANS[stage.id] : fallbackPlan;
}

export function mealSlotLabel(plan: NutritionEntryPlan, value: MealEntry["meal"]) {
  return plan.mealOptions.find((item) => item.value === value)?.shortLabel ?? value;
}
