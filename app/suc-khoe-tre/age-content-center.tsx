"use client";

import { useEffect, useMemo, useState } from "react";
import EarlyChildhoodGuide from "./early-childhood-guide";
import { HEALTH_LIFE_STAGES, type HealthLifeStageId } from "./health-age-scope";

const STAGE_NOTES: Partial<Record<HealthLifeStageId, readonly string[]>> = {
  "school-age-6-8y": [
    "Duy trì ăn sáng, bữa ăn đa dạng và nước là đồ uống chính.",
    "Khuyến khích vận động hằng ngày, chơi ngoài trời và hạn chế ngồi lâu.",
    "Theo dõi thị lực, tư thế học, răng miệng và chất lượng giấc ngủ.",
    "Dạy kỹ năng an toàn nước, giao thông, người lạ và sử dụng thiết bị số phù hợp tuổi.",
  ],
  foundation: [
    "Xây nền thói quen ăn – ngủ – vận động – vệ sinh trước giai đoạn dậy thì.",
    "Theo dõi tăng trưởng theo xu hướng thay vì một số đo đơn lẻ.",
    "Bắt đầu nội dung thay đổi cơ thể bằng ngôn ngữ bình tĩnh, phù hợp tuổi.",
    "Duy trì hỗ trợ học đường, mắt, tư thế, răng miệng và an toàn cá nhân.",
  ],
  preteen: [
    "Ưu tiên hiểu thay đổi cơ thể, vệ sinh dậy thì và dinh dưỡng tăng trưởng.",
    "Theo dõi giấc ngủ, vận động, cảm xúc và quan hệ bạn bè.",
    "Bổ sung kỹ năng ranh giới cá nhân, bắt nạt, an toàn số và tìm người lớn tin cậy.",
  ],
  "early-adolescent": [
    "Theo dõi sức khỏe tinh thần, giấc ngủ, dinh dưỡng và hình ảnh cơ thể mà không dùng điểm sức khỏe tổng hợp.",
    "Tăng dần quyền tự quản lý phù hợp, vẫn giữ lớp riêng tư hồ sơ.",
    "Tập trung phòng tránh chất gây nghiện/nguy cơ, quan hệ an toàn và biết khi nào cần tìm hỗ trợ.",
  ],
  "late-adolescent": [
    "Biết thuốc, dị ứng, tiền sử quan trọng và thông tin khẩn cấp của bản thân.",
    "Tập tự quản lý lịch khám, nhắc việc, tài liệu và chăm sóc thường quy.",
    "Chuẩn bị sống xa gia đình, biết nơi tìm chăm sóc thường quy/cấp cứu và hiểu lựa chọn riêng tư.",
  ],
};

export default function AgeContentCenter({ ageMonths, sex }: { ageMonths: number | null; sex: "male" | "female" | "" }) {
  const current = useMemo(() => HEALTH_LIFE_STAGES.find((stage) => ageMonths !== null && ageMonths >= stage.minMonths && ageMonths <= stage.maxMonths) ?? null, [ageMonths]);
  const [selectedId, setSelectedId] = useState<HealthLifeStageId>(current?.id ?? "infant-9-11m");

  useEffect(() => {
    if (current) setSelectedId(current.id);
  }, [current]);

  const selected = HEALTH_LIFE_STAGES.find((stage) => stage.id === selectedId) ?? HEALTH_LIFE_STAGES[0];
  const isEarlyChildhood = selected.maxMonths <= 71;

  return <section className="ac-center" aria-label="Trung tâm nội dung theo tuổi từ 9 tháng đến 18 tuổi">
    <header className="ac-center-head">
      <div><span className="hf-kicker">Age Content Center</span><h3>9 tháng → 18 tuổi · một lộ trình liên tục</h3><p>Nút đang chọn luôn giữ trạng thái active/lõm. Việc chọn giai đoạn ở đây chỉ để xem nội dung; không thay đổi ngày sinh hay hồ sơ sức khỏe.</p></div>
      <span className="ac-current-pill">{current ? `Hồ sơ: ${current.shortLabel}` : "Chưa xác định tuổi hồ sơ"}</span>
    </header>

    <div className="ac-stage-tabs" role="tablist" aria-label="Chọn giai đoạn tuổi để xem nội dung">
      {HEALTH_LIFE_STAGES.map((stage) => <button key={stage.id} type="button" role="tab" aria-selected={selectedId === stage.id} aria-pressed={selectedId === stage.id} className={selectedId === stage.id ? "is-active" : ""} onClick={() => setSelectedId(stage.id)}><span>{stage.shortLabel}</span>{current?.id === stage.id ? <small>Tuổi hồ sơ</small> : null}</button>)}
    </div>

    <article className="ac-stage-summary">
      <div><span className="hf-kicker">Giai đoạn đang xem</span><h4>{selected.label}</h4></div>
      <div className="ac-focus-grid">{selected.focus.map((item) => <span key={item}>{item}</span>)}</div>
    </article>

    {isEarlyChildhood ? <EarlyChildhoodGuide ageMonths={selected.id === current?.id ? ageMonths : selected.minMonths} sex={sex} /> : <section className="ac-older-guide">
      <div className="ac-content-grid">
        {(STAGE_NOTES[selected.id] ?? selected.focus).map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></article>)}
      </div>
      <div className="ac-safety-note"><strong>Nguyên tắc chung:</strong> nội dung theo tuổi giúp tổ chức theo dõi và giáo dục sức khỏe; không tự tạo chẩn đoán, không tự kê đơn và không thay thế đánh giá chuyên môn.</div>
    </section>}
  </section>;
}
