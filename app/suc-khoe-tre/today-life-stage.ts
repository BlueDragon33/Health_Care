import type { DailyRecord, TaskKey } from "./health-local-store";
import type { HealthLifeStage, HealthLifeStageId } from "./health-age-scope";

type TodayTask = {
  key: TaskKey;
  label: string;
  group: string;
};

type TodayRoutine = {
  stageId: HealthLifeStageId;
  title: string;
  progressSummary: string;
  note: string;
  tasks: readonly TodayTask[];
};

const olderChildTasks: readonly TodayTask[] = [
  { key: "breakfast", label: "Đã ghi bữa sáng / bữa đầu ngày", group: "Dinh dưỡng" },
  { key: "water", label: "Đã theo dõi nước uống", group: "Dinh dưỡng" },
  { key: "movement", label: "Có vận động trong ngày", group: "Vận động" },
  { key: "teethMorning", label: "Đánh răng buổi sáng", group: "Chăm sóc" },
  { key: "teethEvening", label: "Đánh răng buổi tối", group: "Chăm sóc" },
  { key: "sleep", label: "Đã ghi / chuẩn bị giấc ngủ", group: "Giấc ngủ" },
];

export const TODAY_LIFE_STAGE_ROUTINES: Record<HealthLifeStageId, TodayRoutine> = {
  "infant-9-11m": {
    stageId: "infant-9-11m",
    title: "Hôm nay · 9–11 tháng",
    progressSummary: "Ăn/bú · chơi vận động · răng/nướu · giấc ngủ.",
    note: "Checklist chỉ nhắc các mục đã theo dõi. Không dùng số mục hoàn thành để kết luận trẻ ăn đủ, phát triển đủ hoặc khỏe/bệnh.",
    tasks: [
      { key: "breakfast", label: "Đã theo dõi ăn bổ sung trong ngày", group: "Ăn & bú" },
      { key: "water", label: "Đã theo dõi bú/sữa và chất lỏng", group: "Ăn & bú" },
      { key: "movement", label: "Có chơi vận động trên sàn / đổi tư thế", group: "Vận động" },
      { key: "teethMorning", label: "Chăm răng/nướu buổi sáng nếu phù hợp", group: "Răng miệng" },
      { key: "teethEvening", label: "Chăm răng/nướu buổi tối nếu phù hợp", group: "Răng miệng" },
      { key: "sleep", label: "Đã ghi hoặc theo dõi giấc ngủ", group: "Giấc ngủ" },
    ],
  },
  "toddler-12-23m": {
    stageId: "toddler-12-23m",
    title: "Hôm nay · 12–23 tháng",
    progressSummary: "Ăn/uống · chơi chủ động · răng miệng · giấc ngủ.",
    note: "Theo dõi thói quen rải trong ngày; không ép trẻ hoàn thành checklist để đạt điểm sức khỏe.",
    tasks: [
      { key: "breakfast", label: "Đã ghi bữa ăn / bữa đầu ngày", group: "Dinh dưỡng" },
      { key: "water", label: "Đã theo dõi đồ uống / nước phù hợp", group: "Dinh dưỡng" },
      { key: "movement", label: "Có tập đi / chơi chủ động", group: "Vận động" },
      { key: "teethMorning", label: "Chải răng buổi sáng có người lớn hỗ trợ", group: "Răng miệng" },
      { key: "teethEvening", label: "Chải răng buổi tối có người lớn hỗ trợ", group: "Răng miệng" },
      { key: "sleep", label: "Đã ghi hoặc chuẩn bị giấc ngủ", group: "Giấc ngủ" },
    ],
  },
  "early-childhood-2-5y": {
    stageId: "early-childhood-2-5y",
    title: "Hôm nay · 2–5 tuổi",
    progressSummary: "Bữa ăn · nước · chơi vận động · răng miệng · giấc ngủ.",
    note: "Checklist hỗ trợ nếp sinh hoạt và sự tự lập dần; không phải thang điểm phát triển hay công cụ chẩn đoán.",
    tasks: [
      { key: "breakfast", label: "Có bữa sáng / bữa đầu ngày", group: "Dinh dưỡng" },
      { key: "water", label: "Đã theo dõi nước / đồ uống", group: "Dinh dưỡng" },
      { key: "movement", label: "Có chơi vận động trong ngày", group: "Vận động" },
      { key: "teethMorning", label: "Chải răng buổi sáng có người lớn hỗ trợ", group: "Răng miệng" },
      { key: "teethEvening", label: "Chải răng buổi tối có người lớn hỗ trợ", group: "Răng miệng" },
      { key: "sleep", label: "Đã ghi / chuẩn bị giấc ngủ", group: "Giấc ngủ" },
    ],
  },
  "school-age-6-8y": {
    stageId: "school-age-6-8y",
    title: "Hôm nay · 6–8 tuổi",
    progressSummary: "Dinh dưỡng · vận động · răng miệng · giấc ngủ học đường.",
    note: "Mục tiêu là hình thành thói quen; không dùng tiến độ để xếp hạng sức khỏe hoặc hình thể.",
    tasks: olderChildTasks,
  },
  foundation: {
    stageId: "foundation",
    title: "Hôm nay · 9–10 tuổi",
    progressSummary: "Dinh dưỡng · vận động · răng miệng · giấc ngủ.",
    note: "Checklist phản ánh dữ liệu đã ghi và thói quen trong ngày, không phải điểm sức khỏe.",
    tasks: olderChildTasks,
  },
  preteen: {
    stageId: "preteen",
    title: "Hôm nay · 11–12 tuổi",
    progressSummary: "Ăn uống · vận động · vệ sinh/răng miệng · giấc ngủ.",
    note: "Theo dõi để hỗ trợ giai đoạn tăng trưởng và tự chăm sóc, không chấm điểm ngoại hình hay cân nặng.",
    tasks: olderChildTasks,
  },
  "early-adolescent": {
    stageId: "early-adolescent",
    title: "Hôm nay · 13–15 tuổi",
    progressSummary: "Ăn uống · vận động · tự chăm sóc · giấc ngủ và hồi phục.",
    note: "Tiến độ chỉ là nhật ký thói quen; không dùng để tạo điểm sức khỏe, mục tiêu siết cân hoặc kết luận y khoa.",
    tasks: olderChildTasks,
  },
  "late-adolescent": {
    stageId: "late-adolescent",
    title: "Hôm nay · 16–18 tuổi",
    progressSummary: "Tự quản lý ăn uống · vận động · chăm sóc · giấc ngủ.",
    note: "Checklist hỗ trợ tự quản lý khi lịch học thay đổi hoặc chuẩn bị sống xa nhà; không thay thế đánh giá chuyên môn.",
    tasks: olderChildTasks,
  },
};

const fallbackRoutine: TodayRoutine = {
  stageId: "foundation",
  title: "Hôm nay",
  progressSummary: "Dinh dưỡng · vận động · răng miệng · giấc ngủ.",
  note: "Nhập ngày sinh trong Hồ sơ để checklist đổi theo đúng giai đoạn tuổi.",
  tasks: olderChildTasks,
};

export function todayRoutineForLifeStage(stage: HealthLifeStage | null) {
  return stage ? TODAY_LIFE_STAGE_ROUTINES[stage.id] : fallbackRoutine;
}

export function todayNutritionMetric(stage: HealthLifeStage | null, day: DailyRecord, foodGroupTotal: number) {
  if (stage?.id === "infant-9-11m") {
    return `${day.meals.length} bản ghi ăn · ${day.foodGroups.length} nhóm đã ghi`;
  }
  if (stage?.id === "toddler-12-23m") {
    return `${day.meals.length} bản ghi bữa · ${day.foodGroups.length} nhóm đã ghi`;
  }
  return `${day.foodGroups.length}/${foodGroupTotal} nhóm · ${day.waterCups} cốc nước`;
}

export function todayWeekMetric(stage: HealthLifeStage | null, day: DailyRecord) {
  const minutes = day.activities.reduce((sum, item) => sum + item.minutes, 0);
  if (stage?.id === "infant-9-11m") return `${day.meals.length} bản ghi ăn · ${minutes} phút chơi đã ghi`;
  if (stage?.id === "toddler-12-23m") return `${day.meals.length} bản ghi bữa · ${minutes} phút chơi`;
  return `${day.waterCups} cốc · ${minutes} phút`;
}
