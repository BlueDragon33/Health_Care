import type { DailyRecord } from "./health-local-store";
import type { HealthLifeStage, HealthLifeStageId } from "./health-age-scope";

type NutritionStagePlan = {
  stageId: HealthLifeStageId;
  title: string;
  summary: string;
  priorities: readonly string[];
  caution: string;
  evidence: string;
};

type NutritionCheck = {
  id: string;
  label: string;
  done: boolean;
};

export const NUTRITION_STAGE_PLANS: Record<HealthLifeStageId, NutritionStagePlan> = {
  "infant-9-11m": {
    stageId: "infant-9-11m",
    title: "9–11 tháng · Ăn bổ sung an toàn, tăng dần độ thô",
    summary: "Ăn bổ sung đi cùng sữa mẹ/sữa công thức phù hợp; mục tiêu của nhật ký là quan sát sự đa dạng, kỹ năng ăn và an toàn chứ không tính calorie hoặc ép lượng ăn.",
    priorities: [
      "Tiếp tục sữa mẹ nếu đang bú hoặc sữa công thức phù hợp; thức ăn bổ sung không được hiểu là thay thế hoàn toàn nguồn sữa ở giai đoạn này.",
      "Tăng dần độ đặc, độ thô và đa dạng theo kỹ năng ăn; ưu tiên thực phẩm giàu dinh dưỡng, có nguồn đạm/sắt phù hợp và rau hoặc trái cây.",
      "Cho trẻ ngồi ăn có người lớn quan sát, điều chỉnh kích thước/độ mềm của thức ăn để giảm nguy cơ hóc.",
      "Quan sát dấu đói/no và hỗ trợ trẻ ăn; nhật ký không dùng để ép trẻ hoàn thành khẩu phần cố định.",
    ],
    caution: "Không dùng mật ong trước 12 tháng; không dùng sữa bò nguyên chất làm đồ uống chính trước 12 tháng; tránh thực phẩm có nguy cơ hóc ở dạng không phù hợp.",
    evidence: "Nền tảng nội dung: WHO Guideline for complementary feeding of infants and young children 6–23 months (2023) và các nguyên tắc an toàn ăn bổ sung trong cẩm nang trẻ nhỏ của ứng dụng.",
  },
  "toddler-12-23m": {
    stageId: "toddler-12-23m",
    title: "12–23 tháng · Tự ăn dần, bữa gia đình & responsive feeding",
    summary: "Chuyển dần sang thức ăn gia đình phù hợp kỹ năng nhai/nuốt, duy trì khẩu phần đa dạng và hỗ trợ trẻ tự ăn mà không dùng ép ăn hoặc cân nặng làm thưởng/phạt.",
    priorities: [
      "Duy trì các bữa ăn và bữa phụ phù hợp nhịp sinh hoạt; tiếp tục bú mẹ nếu mẹ và trẻ mong muốn.",
      "Cho trẻ làm quen cốc/thìa và tự ăn dần; chấp nhận việc ăn chậm hoặc làm đổ như một phần của học kỹ năng.",
      "Luân phiên nguồn đạm, rau, trái cây, ngũ cốc/tinh bột và nguồn canxi phù hợp với gia đình.",
      "Tiếp tục chống hóc: trẻ ngồi khi ăn, có người lớn quan sát và thức ăn được cắt/chế biến phù hợp.",
    ],
    caution: "Không để sữa hoặc đồ uống ngọt thay thế kéo dài cho bữa ăn đa dạng; khi có dị ứng, bệnh mạn tính, khó nuốt hoặc tăng trưởng bất thường cần kế hoạch riêng từ nhân viên y tế.",
    evidence: "Nền tảng nội dung: WHO complementary feeding 6–23 months (2023) và nguyên tắc responsive feeding/an toàn thực phẩm theo tuổi.",
  },
  "early-childhood-2-5y": {
    stageId: "early-childhood-2-5y",
    title: "2–5 tuổi · Bữa gia đình đa dạng & xây thói quen",
    summary: "Tập trung vào nhịp bữa đều, thực phẩm đa dạng và môi trường ăn tích cực; không biến nhật ký thành công cụ chấm điểm cân nặng hoặc ăn kiêng.",
    priorities: [
      "Ăn cùng gia đình khi có thể, ưu tiên thực phẩm đa dạng và ít chế biến hơn.",
      "Nước là đồ uống thường ngày; hạn chế việc đồ uống có đường trở thành thói quen lặp lại.",
      "Cho trẻ tham gia lựa chọn/chuẩn bị món phù hợp tuổi và tôn trọng tín hiệu đói/no.",
      "Tiếp tục chú ý chống hóc, an toàn thực phẩm và vệ sinh tay trước ăn.",
    ],
    caution: "Không tự áp chế độ giảm cân, nhịn ăn hoặc mục tiêu calorie/hình thể người lớn cho trẻ nhỏ.",
    evidence: "Nền tảng nội dung: WHO Healthy diet (cập nhật 26/01/2026) kết hợp hướng dẫn chăm sóc trẻ nhỏ 2–5 tuổi đã được lưu trong ứng dụng.",
  },
  "school-age-6-8y": {
    stageId: "school-age-6-8y",
    title: "6–8 tuổi · Nền tảng ăn uống học đường",
    summary: "Ưu tiên bữa ăn đều, đồ uống phù hợp và sự đa dạng để hỗ trợ học tập, vận động và tăng trưởng; chưa dùng mục tiêu cân nặng người lớn.",
    priorities: [
      "Duy trì bữa sáng hoặc bữa đầu ngày phù hợp lịch học khi có thể.",
      "Luân phiên rau, trái cây, nguồn đạm, ngũ cốc/tinh bột và sữa/thực phẩm tương đương.",
      "Ưu tiên nước làm đồ uống thường ngày; hạn chế đồ uống có đường trở thành thói quen.",
      "Khuyến khích trẻ nhận biết món ăn và tham gia lựa chọn lành mạnh thay vì gắn thức ăn với thưởng/phạt.",
    ],
    caution: "Không áp chế độ giảm cân, nhịn ăn hoặc mục tiêu hình thể người lớn cho nhóm tuổi học đường.",
    evidence: "Nền tảng nội dung: WHO Healthy diet (cập nhật 26/01/2026) và nguyên tắc dinh dưỡng học đường theo giai đoạn 6–8 tuổi trong ứng dụng.",
  },
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
    evidence: "Nền tảng nội dung: WHO Healthy diet (cập nhật 26/01/2026) — đủ, cân bằng, điều độ, đa dạng và an toàn.",
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
    evidence: "Nền tảng nội dung: WHO Healthy diet (cập nhật 26/01/2026); nhu cầu cụ thể còn phụ thuộc tăng trưởng, hoạt động và tình trạng sức khỏe.",
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
    evidence: "Nền tảng nội dung: WHO Healthy diet (cập nhật 26/01/2026); ứng dụng không chấm điểm ngoại hình hoặc tạo mục tiêu giảm cân.",
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
    evidence: "Nền tảng nội dung: WHO Healthy diet (cập nhật 26/01/2026); nhu cầu cụ thể còn phụ thuộc tuổi, giới, hoạt động, tăng trưởng và bệnh lý.",
  },
};

function mainMealCount(day: DailyRecord) {
  const mainMeals = new Set(day.meals.filter((entry) => entry.meal !== "snack").map((entry) => entry.meal));
  return mainMeals.size;
}

function nutritionFoodGroupCount(day: DailyRecord) {
  return day.foodGroups.filter((group) => group !== "Nước").length;
}

export function nutritionChecklistForStage(stageId: HealthLifeStageId, day: DailyRecord): NutritionCheck[] {
  const has = (group: string) => day.foodGroups.includes(group);
  const fruitOrVegetable = has("Rau") || has("Trái cây");
  const fruitAndVegetables = has("Rau") && has("Trái cây");
  const variety = nutritionFoodGroupCount(day) >= 4;
  const infantVariety = nutritionFoodGroupCount(day) >= 3;
  const waterLogged = day.waterCups > 0 || day.tasks.water;
  const breakfastLogged = day.tasks.breakfast || day.meals.some((entry) => entry.meal === "breakfast");
  const mealsLogged = mainMealCount(day);
  const anyMealLogged = day.meals.length > 0;

  if (stageId === "infant-9-11m") {
    return [
      { id: "complementary-meal", label: "Đã ghi ít nhất 1 bữa ăn bổ sung", done: anyMealLogged },
      { id: "protein", label: "Đã ghi nhóm đạm", done: has("Đạm") },
      { id: "produce", label: "Đã ghi rau hoặc trái cây", done: fruitOrVegetable },
      { id: "variety", label: "Đã ghi từ 3 nhóm thực phẩm", done: infantVariety },
    ];
  }

  if (stageId === "toddler-12-23m") {
    return [
      { id: "meals", label: "Đã ghi ít nhất 2 bữa chính", done: mealsLogged >= 2 },
      { id: "protein", label: "Đã ghi nhóm đạm", done: has("Đạm") },
      { id: "produce", label: "Đã ghi rau hoặc trái cây", done: fruitOrVegetable },
      { id: "variety", label: "Đã ghi từ 4 nhóm thực phẩm", done: variety },
    ];
  }

  if (stageId === "early-childhood-2-5y") {
    return [
      { id: "meals", label: "Đã ghi ít nhất 2 bữa chính", done: mealsLogged >= 2 },
      { id: "variety", label: "Đã ghi từ 4 nhóm thực phẩm", done: variety },
      { id: "fruit-veg", label: "Đã ghi cả rau và trái cây", done: fruitAndVegetables },
      { id: "protein", label: "Đã ghi nhóm đạm", done: has("Đạm") },
      { id: "water", label: "Đã ghi nước uống", done: waterLogged },
    ];
  }

  if (stageId === "school-age-6-8y" || stageId === "foundation") {
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

export default function NutritionStagePanel({ stage, day }: { stage: HealthLifeStage | null; day: DailyRecord }) {
  if (!stage) {
    return <section className="hf-panel hf-info-panel">
      <span className="hf-kicker">Dinh dưỡng theo nhóm tuổi</span>
      <h3>Cần ngày sinh để chọn chế độ phù hợp</h3>
      <p>Nhập ngày sinh trong Hồ sơ. Ứng dụng sẽ chọn đúng một trong 8 giai đoạn liên tục từ 9–11 tháng đến 16–18 tuổi; không suy đoán tuổi từ chiều cao/cân nặng.</p>
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
    <p className="hf-muted">Dấu ✓ chỉ phản ánh dữ liệu đã ghi trong ứng dụng, không kết luận trẻ đã ăn đủ hoặc thiếu. {plan.evidence}</p>
  </section>;
}
