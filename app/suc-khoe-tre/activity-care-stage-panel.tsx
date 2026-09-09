import type { HealthLifeStage, HealthLifeStageId } from "./health-age-scope";

type ActivityPlan = {
  title: string;
  summary: string;
  options: readonly string[];
  focus: readonly string[];
  loggingNote: string;
};

type CarePlan = {
  title: string;
  sleep: string;
  oral: string;
  dailyCare: string;
  screenLearning: string;
  safety: string;
};

export const ACTIVITY_LIFE_STAGE_PLANS: Record<HealthLifeStageId, ActivityPlan> = {
  "infant-9-11m": {
    title: "9–11 tháng · Chơi vận động trên sàn",
    summary: "Không dùng mục tiêu 60 phút kiểu trẻ lớn. Ghi các khoảng chơi vận động được quan sát trong ngày để nhìn xu hướng, không chấm điểm thể lực.",
    options: ["Chơi trên sàn", "Bò / trườn", "Chuyển tư thế", "Vươn với đồ chơi", "Chơi tương tác", "Khác"],
    focus: ["nhiều đợt vận động trong ngày", "không gian sàn an toàn", "tương tác với người chăm sóc"],
    loggingNote: "Số phút chỉ là thời lượng quan sát được của một đợt chơi; không phải chỉ tiêu bắt buộc cho trẻ 9–11 tháng.",
  },
  "toddler-12-23m": {
    title: "12–23 tháng · Tập đi và chơi tự do",
    summary: "Ưu tiên vận động đa dạng rải trong ngày. WHO dùng mốc tổng hoạt động khoảng 180 phút/ngày cho trẻ 1–2 tuổi; ứng dụng chỉ giúp ghi lại, không ép đạt điểm.",
    options: ["Đi bộ / tập đi", "Chơi tự do", "Leo trèo có giám sát", "Bóng nhẹ", "Nhảy / múa", "Khác"],
    focus: ["vận động rải trong ngày", "chơi chủ động", "môi trường an toàn"],
    loggingNote: "Có thể ghi từng đợt ngắn; tổng ngày được cộng từ các bản ghi.",
  },
  "early-childhood-2-5y": {
    title: "2–5 tuổi · Chơi vận động đa dạng",
    summary: "Tăng cơ hội chạy, nhảy, leo, chơi ngoài trời và vận động phù hợp khả năng; không biến module thành chương trình gym hoặc giảm cân.",
    options: ["Chơi ngoài trời", "Chạy", "Nhảy / múa", "Leo trèo", "Xe đạp phù hợp tuổi", "Bơi có giám sát", "Khác"],
    focus: ["chơi vận động mỗi ngày", "đa dạng kỹ năng", "giảm thời gian ngồi yên kéo dài"],
    loggingNote: "Ghi thời lượng để theo dõi thói quen và xu hướng; không dùng một ngày đơn lẻ để kết luận thể lực.",
  },
  "school-age-6-8y": {
    title: "6–8 tuổi · Nền tảng vận động học đường",
    summary: "WHO khuyến nghị trẻ 5–17 tuổi trung bình khoảng 60 phút/ngày hoạt động thể lực mức vừa đến mạnh; có thể tích lũy từ chơi, đi lại và thể thao.",
    options: ["Đi bộ", "Chạy", "Đạp xe", "Bơi", "Bóng đá / bóng rổ", "Nhảy dây", "Thể dục", "Khác"],
    focus: ["vận động hằng ngày", "kỹ năng vận động", "niềm vui và an toàn"],
    loggingNote: "Theo dõi thói quen, không dùng để siết cân hoặc xếp hạng hình thể.",
  },
  foundation: {
    title: "9–10 tuổi · Xây nền thể lực",
    summary: "Ưu tiên vận động hằng ngày, trò chơi chủ động và thể thao phù hợp sở thích; tránh biến thời lượng thành áp lực thành tích.",
    options: ["Đi bộ", "Chạy", "Đạp xe", "Bơi", "Bóng đá / bóng rổ", "Nhảy dây", "Thể dục", "Khác"],
    focus: ["duy trì đều", "đa dạng hoạt động", "ngủ và hồi phục"],
    loggingNote: "Mục tiêu là nhìn xu hướng hoạt động, không phải app gym hay công cụ giảm cân.",
  },
  preteen: {
    title: "11–12 tuổi · Vận động trong giai đoạn tăng trưởng",
    summary: "Giữ nhịp vận động đều trong tuần, phối hợp hoạt động sức bền, kỹ năng và sức mạnh phù hợp tuổi dưới hướng dẫn an toàn.",
    options: ["Đi bộ", "Chạy", "Đạp xe", "Bơi", "Thể thao đồng đội", "Nhảy dây", "Thể dục / sức mạnh phù hợp tuổi", "Khác"],
    focus: ["đều đặn", "kỹ thuật an toàn", "không chạy theo hình thể"],
    loggingNote: "Không tự đặt chương trình tăng cơ/giảm cân cực đoan từ dữ liệu nhật ký.",
  },
  "early-adolescent": {
    title: "13–15 tuổi · Dậy thì, thể lực & hồi phục",
    summary: "Theo dõi hoạt động, giấc ngủ và cảm nhận cơ thể cùng nhau; không dùng dữ liệu để ép cân hoặc so sánh ngoại hình.",
    options: ["Đi bộ", "Chạy", "Đạp xe", "Bơi", "Thể thao đồng đội", "Sức mạnh có hướng dẫn", "Thể dục", "Khác"],
    focus: ["vận động hằng ngày", "kỹ thuật", "hồi phục và giấc ngủ"],
    loggingNote: "Đau, chấn thương hoặc mệt bất thường cần được xử lý theo bối cảnh y tế phù hợp, không dựa vào điểm hoạt động.",
  },
  "late-adolescent": {
    title: "16–18 tuổi · Tự quản lý vận động an toàn",
    summary: "Chuẩn bị khả năng tự duy trì lịch vận động khi học xa nhà, ưu tiên tính bền vững, kỹ thuật và phục hồi thay vì hình thể.",
    options: ["Đi bộ", "Chạy", "Đạp xe", "Bơi", "Thể thao", "Sức mạnh có hướng dẫn", "Mobility / giãn cơ", "Khác"],
    focus: ["lịch vận động bền vững", "kỹ thuật", "nhận biết khi cần nghỉ hoặc tìm trợ giúp"],
    loggingNote: "Nhật ký hỗ trợ tự quản lý; không thay thế đánh giá chuyên môn khi có chấn thương hoặc triệu chứng bất thường.",
  },
};

export const CARE_LIFE_STAGE_PLANS: Record<HealthLifeStageId, CarePlan> = {
  "infant-9-11m": {
    title: "9–11 tháng · Ngủ, răng đầu tiên & an toàn",
    sleep: "Khoảng 12–16 giờ/24 giờ gồm cả ngủ ngày; theo dõi xu hướng thay vì chấm điểm một đêm.",
    oral: "Nếu đã mọc răng: chải với kem fluoride lượng rất nhỏ cỡ hạt gạo và có người lớn thực hiện/hỗ trợ.",
    dailyCare: "Tắm, thay tã, chăm da và vệ sinh phù hợp; ghi điều bất thường nếu cần theo dõi.",
    screenLearning: "Không dùng bộ đếm nghỉ mắt kiểu học đường. Ưu tiên chơi, giao tiếp trực tiếp và nội dung theo Cẩm nang trẻ nhỏ.",
    safety: "Ưu tiên chống hóc, ngã, bỏng, đuối nước và tiếp cận thuốc/hóa chất.",
  },
  "toddler-12-23m": {
    title: "12–23 tháng · Ngủ đều, răng miệng & môi trường an toàn",
    sleep: "Khoảng 11–14 giờ/24 giờ gồm ngủ ngày; giữ trình tự trước ngủ đơn giản và tương đối ổn định.",
    oral: "Chải răng có người lớn hỗ trợ; lượng kem fluoride rất nhỏ cỡ hạt gạo.",
    dailyCare: "Khuyến khích tự làm từng phần nhỏ như rửa tay, dùng cốc/thìa với hỗ trợ.",
    screenLearning: "Không dùng bộ đếm nghỉ mắt học đường cho nhóm này; ưu tiên tương tác và chơi chủ động.",
    safety: "Tăng chú ý ngã, leo trèo, nước, giao thông, thuốc và hóa chất trong tầm với.",
  },
  "early-childhood-2-5y": {
    title: "2–5 tuổi · Tự lập dần và chuẩn bị đi học",
    sleep: "2 tuổi thường cần 11–14 giờ; 3–5 tuổi khoảng 10–13 giờ/24 giờ, gồm ngủ ngày nếu còn ngủ.",
    oral: "Người lớn tiếp tục hỗ trợ chải; từ khoảng 3 tuổi có thể dùng lượng kem fluoride cỡ hạt đậu theo hướng dẫn phù hợp.",
    dailyCare: "Tập rửa tay, mặc đồ, đi vệ sinh và tự chăm sóc theo mức phát triển, không kỳ vọng giống nhau ở mọi trẻ.",
    screenLearning: "Theo dõi thói quen màn hình tổng thể; chưa dùng bộ đếm nghỉ mắt kiểu học đường làm chỉ tiêu chính.",
    safety: "An toàn nước, đường bộ, hóc, ngã và cất thuốc/hóa chất ngoài tầm với vẫn là ưu tiên.",
  },
  "school-age-6-8y": {
    title: "6–8 tuổi · Chăm sóc học đường",
    sleep: "Trẻ 6–12 tuổi thường cần khoảng 9–12 giờ ngủ/24 giờ.",
    oral: "Duy trì chải răng đều và khám răng theo nhu cầu/hướng dẫn của gia đình và chuyên môn.",
    dailyCare: "Tăng dần khả năng tự vệ sinh nhưng người lớn vẫn kiểm tra và hỗ trợ khi cần.",
    screenLearning: "Có thể dùng bộ đếm nghỉ mắt như công cụ nhắc thói quen khi học/màn hình; không dùng để chẩn đoán tật khúc xạ.",
    safety: "Chú ý giao thông, nước, thể thao và kỹ năng tìm người lớn khi cần trợ giúp.",
  },
  foundation: {
    title: "9–10 tuổi · Củng cố thói quen tự chăm sóc",
    sleep: "Nhóm 6–12 tuổi thường cần khoảng 9–12 giờ ngủ/24 giờ.",
    oral: "Duy trì chải răng đều và theo dõi vấn đề răng miệng nếu xuất hiện.",
    dailyCare: "Tự thực hiện phần lớn vệ sinh cá nhân với nhắc nhở vừa đủ.",
    screenLearning: "Theo dõi thời gian học/màn hình và các lần nghỉ mắt như thói quen; không biến thành điểm sức khỏe.",
    safety: "Bổ sung an toàn số, giao thông và thể thao bên cạnh kỹ năng tự bảo vệ cơ bản.",
  },
  preteen: {
    title: "11–12 tuổi · Tiền dậy thì & vệ sinh cá nhân",
    sleep: "Ở 11–12 tuổi vẫn thuộc nhóm thường cần khoảng 9–12 giờ ngủ/24 giờ.",
    oral: "Duy trì chải răng và chú ý vệ sinh nếu có chỉnh nha hoặc thiết bị nha khoa.",
    dailyCare: "Bổ sung vệ sinh cơ thể, mồ hôi và thay đổi tuổi dậy thì theo cách riêng tư, không phán xét.",
    screenLearning: "Theo dõi học tập/màn hình, nghỉ mắt và tư thế như thói quen hỗ trợ sức khỏe học đường.",
    safety: "Chú ý bắt nạt, an toàn số, ranh giới cá nhân và tìm người lớn tin cậy khi cần.",
  },
  "early-adolescent": {
    title: "13–15 tuổi · Tự chăm sóc trong tuổi dậy thì",
    sleep: "Thanh thiếu niên 13–18 tuổi thường cần khoảng 8–10 giờ ngủ/24 giờ.",
    oral: "Duy trì chăm sóc răng miệng và xử lý vấn đề theo tư vấn nha khoa khi cần.",
    dailyCare: "Tự quản lý vệ sinh, da/tóc và thay đổi cơ thể; tránh các sản phẩm hoặc cách xử trí gây hại.",
    screenLearning: "Theo dõi màn hình, học tập, nghỉ mắt và giấc ngủ cùng nhau thay vì chỉ đếm thời gian.",
    safety: "Bổ sung sức khỏe tinh thần, an toàn số, quan hệ và ranh giới cá nhân.",
  },
  "late-adolescent": {
    title: "16–18 tuổi · Chuẩn bị tự quản lý khi sống xa nhà",
    sleep: "Thanh thiếu niên 13–18 tuổi thường cần khoảng 8–10 giờ ngủ/24 giờ.",
    oral: "Biết tự theo dõi lịch nha khoa, triệu chứng răng miệng và thông tin điều trị nếu có.",
    dailyCare: "Chuyển dần sang tự quản lý lịch khám, thuốc theo chỉ định, dị ứng và giấy tờ sức khỏe.",
    screenLearning: "Tự cân bằng học tập, màn hình, nghỉ mắt, vận động và giấc ngủ trong lịch sinh hoạt thực tế.",
    safety: "Chuẩn bị thông tin khẩn cấp, người liên hệ và kỹ năng tìm hỗ trợ khi sống/học xa nhà.",
  },
};

export function activityOptionsForLifeStage(stage: HealthLifeStage | null) {
  return stage ? ACTIVITY_LIFE_STAGE_PLANS[stage.id].options : ["Khác"] as const;
}

export function shouldShowEyeBreakTracker(stage: HealthLifeStage | null) {
  return stage ? stage.minMonths >= 72 : false;
}

export function ActivityStagePanel({ stage }: { stage: HealthLifeStage | null }) {
  if (!stage) return null;
  const plan = ACTIVITY_LIFE_STAGE_PLANS[stage.id];
  return <section className="hf-panel hf-info-panel" data-activity-life-stage={stage.id}>
    <div className="hf-panel-head"><div><span className="hf-kicker">Vận động theo giai đoạn</span><h3>{plan.title}</h3></div></div>
    <p>{plan.summary}</p>
    <div className="hf-chip-grid">{plan.focus.map((item) => <span className="hf-chip" key={item}>{item}</span>)}</div>
    <p className="hf-muted">{plan.loggingNote}</p>
  </section>;
}

export function CareStagePanel({ stage }: { stage: HealthLifeStage | null }) {
  if (!stage) return null;
  const plan = CARE_LIFE_STAGE_PLANS[stage.id];
  return <section className="hf-panel hf-info-panel" data-care-life-stage={stage.id}>
    <div className="hf-panel-head"><div><span className="hf-kicker">Chăm sóc theo giai đoạn</span><h3>{plan.title}</h3></div></div>
    <div className="hf-work-grid">
      <div><strong>Giấc ngủ</strong><p>{plan.sleep}</p></div>
      <div><strong>Răng miệng</strong><p>{plan.oral}</p></div>
      <div><strong>Tự chăm sóc</strong><p>{plan.dailyCare}</p></div>
      <div><strong>Mắt, màn hình & học tập</strong><p>{plan.screenLearning}</p></div>
    </div>
    <div className="hf-safety-note"><strong>An toàn:</strong> {plan.safety}</div>
    <p className="hf-muted">Các mốc tuổi dùng để tổ chức nội dung và nhật ký; không tự chẩn đoán bệnh, không thay thế tư vấn cá nhân từ nhân viên y tế.</p>
  </section>;
}
