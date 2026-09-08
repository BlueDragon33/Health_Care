import type { DailyRecord } from "./health-local-store";
import type { HealthAgeStage, HealthAgeStageId } from "./health-age-scope";

type NutritionStagePlan = {
  stageId: HealthAgeStageId;
  title: string;
  summary: string;
  priorities: readonly string[];
  caution: string;
};

type NutritionCheck = {
  id: string;
  label: string;
  done: boolean;
};

export const NUTRITION_STAGE_PLANS: Record<HealthAgeStageId, NutritionStagePlan> = {
  foundation: {
    stageId: "foundation",
    title: "9–10 tuổi · Xây nền ăn uống đa dạng",
    summary: "Ưu tiên hình thành nhịp ăn đều và làm quen nhiều nhóm thực phẩm thay vì đặt mục tiêu cân nặng hoặc calorie.",
    priorities: [
      "Ăn các bữa chính đều đặn, đặc biệt không bỏ bữa sáng khi có thể.",
      "Luân phiên rau, trái cây, nguồn đạm, ngũ cốc/tinh bột và sữa hoặc thực phẩm tương đương.",
      "Ưu tiên nước làm đồ uống thường ngày; hạn chế biến đồ uống ngọt thành thói quen.",
      "Dùng nhật ký để quan sát thói quen, không dùng để ép trẻ ăn hoặc tự điều trị.",
    ],
    caution: "Không áp chế độ giảm cân, nhịn ăn hoặc mục tiêu hình thể người lớn cho nhóm tuổi này.",
  },
  preteen: {
    stageId: "preteen",
    title: "11–12 tuổi · Hỗ trợ giai đoạn tiền dậy thì",
    summary: "Giai đoạn tăng trưởng nhanh cần chú ý tính đa dạng, bữa ăn đều và các nguồn thực phẩm giàu đạm, sắt, canxi trong khẩu phần thông thường.",
    priorities: [
      "Duy trì bữa chính đều; tránh để đồ ăn vặt hoặc đồ uống ngọt thay thế bữa.",
      "Có nguồn đạm trong ngày và thường xuyên chọn thực phẩm giàu sắt từ khẩu phần phù hợp gia đình.",
      "Duy trì sữa/thực phẩm tương đương hoặc nguồn canxi phù hợp nếu sử dụng được.",
      "Theo dõi rau, trái cây và nước như thói quen hằng ngày, không chấm điểm ngoại hình.",
    ],
    caution: "Nếu có thiếu máu, dị ứng, bệnh mạn tính hoặc hạn chế ăn uống, mục tiêu dinh dưỡng cần theo tư vấn chuyên môn riêng.",
  },
  "early-adolescent": {
    stageId: "early-adolescent",
    title: "13–15 tuổi · Dậy thì, tăng trưởng & hình ảnh cơ thể",
    summary: "Tập trung vào bữa ăn cân bằng và đủ đa dạng; tránh biến ứng dụng thành công cụ siết cân hoặc ăn kiêng hạn chế ở tuổi dậy thì.",
    priorities: [
      "Giữ nhịp bữa chính tương đối ổn định trong lịch học và hoạt động.",
      "Theo dõi sự hiện diện của rau, trái cây, nguồn đạm và nguồn canxi thay vì chỉ đếm calorie.",
      "Ưu tiên nước; giảm tần suất đồ uống nhiều đường bằng thay đổi thói quen thực tế.",
      "Khi có lo âu về cân nặng/hình thể hoặc hành vi ăn uống bất thường, cần trao đổi với người lớn tin cậy và chuyên môn phù hợp.",
    ],
    caution: "Không tự dùng thuốc, thực phẩm bổ sung hoặc chế độ ăn cực đoan để tăng/giảm cân.",
  },
  "late-adolescent": {
    stageId: "late-adolescent",
    title: "16–18 tuổi · Chuẩn bị tự quản lý khi học xa nhà",
    summary: "Chuyển dần từ được nhắc sang tự lập kế hoạch bữa, lựa chọn thực phẩm và duy trì thói quen an toàn khi lịch học thay đổi.",
    priorities: [
      "Biết tự sắp xếp bữa chính và chuẩn bị lựa chọn dự phòng khi học/di chuyển dài giờ.",
      "Duy trì khẩu phần đa dạng gồm rau, trái cây, nguồn đạm, ngũ cốc/tinh bột và nguồn canxi phù hợp.",
      "Ưu tiên nước và nhận biết đồ uống nhiều đường/năng lượng khi lựa chọn hằng ngày.",
      "Chú ý an toàn thực phẩm, dị ứng đã biết và không tự dùng sản phẩm tăng cơ/giảm cân không rõ chỉ định.",
    ],
    caution: "Khi chuyển sang sống độc lập, nhật ký giúp tự quản lý nhưng không thay thế đánh giá của nhân viên y tế khi có vấn đề sức khỏe.",
  },
};

function mainMealCount(day: DailyRecord) {
  const mainMeals = new Set(day.meals.filter((entry) => entry.meal !== "snack").map((entry) => entry.meal));
  return mainMeals.size;
}

export function nutritionChecklistForStage(stageId: HealthAgeStageId, day: DailyRecord): NutritionCheck[] {
  const has = (group: string) => day.foodGroups.includes(group);
  const fruitAndVegetables = has("Rau") && has("Trái cây");
  const variety = day.foodGroups.length >= 4;
  const waterLogged = day.waterCups > 0 || day.tasks.water;
  const breakfastLogged = day.tasks.breakfast || day.meals.some((entry) => entry.meal === "breakfast");
  const mealsLogged = mainMealCount(day);

  if (stageId === "foundation") {
    return [
      { id: "breakfast", label: "Đã ghi bữa sáng", done: breakfastLogged },
      { id: "fruit-veg", label: "Đã ghi cả rau và trái cây", done: fruitAndVegetables },
      { id: "protein", label: "Đã ghi nhóm đạm", done: has("Đạm") },
      { id: "water", label: "Đã ghi nước uống", done: waterLogged },
    ];
  }

  if (stageId === "preteen") {
    return [
      { id: "meals", label: "Đã ghi ít nhất 2 bữa chính", done: mealsLogged >= 2 },
      { id: "protein", label: "Đã ghi nhóm đạm", done: has("Đạm") },
      { id: "calcium", label: "Đã ghi sữa / thực phẩm tương đương", done: has("Sữa / tương đương") },
      { id: "fruit-veg", label: "Đã ghi cả rau và trái cây", done: fruitAndVegetables },
      { id: "water", label: "Đã ghi nước uống", done: waterLogged },
    ];
  }

  if (stageId === "early-adolescent") {
    return [
      { id: "meals", label: "Đã ghi ít nhất 2 bữa chính", done: mealsLogged >= 2 },
      { id: "variety", label: "Đã ghi từ 4 nhóm thực phẩm", done: variety },
      { id: "fruit-veg", label: "Đã ghi cả rau và trái cây", done: fruitAndVegetables },
      { id: "calcium", label: "Đã ghi sữa / thực phẩm tương đương", done: has("Sữa / tương đương") },
      { id: "water", label: "Đã ghi nước uống", done: waterLogged },
    ];
  }

  return [
    { id: "meals", label: "Đã ghi ít nhất 2 bữa chính", done: mealsLogged >= 2 },
    { id: "variety", label: "Đã ghi từ 4 nhóm thực phẩm", done: variety },
    { id: "fruit-veg", label: "Đã ghi cả rau và trái cây", done: fruitAndVegetables },
    { id: "protein", label: "Đã ghi nhóm đạm", done: has("Đạm") },
    { id: "water", label: "Đã ghi nước uống", done: waterLogged },
  ];
}

export default function NutritionStagePanel({ stage, day }: { stage: HealthAgeStage | null; day: DailyRecord }) {
  if (!stage) {
    return <section className="hf-panel hf-info-panel">
      <span className="hf-kicker">Dinh dưỡng theo nhóm tuổi</span>
      <h3>Cần ngày sinh để chọn chế độ phù hợp</h3>
      <p>Nhập ngày sinh trong Hồ sơ. Ứng dụng sẽ chọn một trong 4 giai đoạn 9–10, 11–12, 13–15 hoặc 16–18 tuổi; không suy đoán tuổi từ chiều cao/cân nặng.</p>
    </section>;
  }

  const plan = NUTRITION_STAGE_PLANS[stage.id];
  const checklist = nutritionChecklistForStage(stage.id, day);
  const done = checklist.filter((item) => item.done).length;

  return <section className="hf-panel hf-info-panel" data-nutrition-stage={stage.id}>
    <div className="hf-panel-head">
      <div><span className="hf-kicker">Dinh dưỡng theo nhóm tuổi</span><h3>{plan.title}</h3></div>
      <small>{done}/{checklist.length} mục đã có dữ liệu</small>
    </div>
    <p>{plan.summary}</p>
    <div className="hf-work-grid">
      <div>
        <strong>Ưu tiên của giai đoạn</strong>
        <ul>{plan.priorities.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div>
        <strong>Checklist theo dữ liệu đã ghi</strong>
        <div className="hf-task-list">{checklist.map((item) => <div className={item.done ? "hf-task is-done" : "hf-task"} key={item.id}><span aria-hidden="true">{item.done ? "✓" : "○"}</span><span><strong>{item.label}</strong><small>{item.done ? "Đã có dữ liệu trong ngày" : "Chưa ghi trong ngày"}</small></span></div>)}</div>
      </div>
    </div>
    <div className="hf-safety-note"><strong>Ranh giới an toàn:</strong> {plan.caution}</div>
    <p className="hf-muted">Dấu ✓ chỉ phản ánh dữ liệu đã ghi trong ứng dụng, không kết luận trẻ đã ăn đủ hoặc thiếu. Nền tảng nội dung: WHO Healthy diet (cập nhật 26/01/2026) — đủ, cân bằng, điều độ, đa dạng và an toàn; nhu cầu cụ thể còn phụ thuộc tuổi, giới, hoạt động, tăng trưởng, bệnh lý và bối cảnh ăn uống.</p>
  </section>;
}
