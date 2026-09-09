"use client";

import { useMemo, useState } from "react";

type EarlyTopic = "overview" | "nutrition" | "sleep" | "development" | "illness" | "safety" | "sex-care";
type Sex = "male" | "female" | "";

const TOPICS: readonly { id: EarlyTopic; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "nutrition", label: "Ăn & uống" },
  { id: "sleep", label: "Giấc ngủ" },
  { id: "development", label: "Phát triển" },
  { id: "illness", label: "Khi ốm" },
  { id: "safety", label: "An toàn" },
  { id: "sex-care", label: "Chăm sóc riêng" },
] as const;

const MILESTONES = [
  { months: 9, label: "9 tháng", items: ["Ngồi không cần đỡ và tự vào tư thế ngồi.", "Chuyển đồ vật giữa hai tay, đập hai đồ vật vào nhau.", "Phản ứng khi gọi tên, có nhiều nét mặt và bập bẹ nhiều âm."] },
  { months: 12, label: "12 tháng", items: ["Vẫy chào, hiểu những từ quen thuộc như “không”.", "Vịn đứng, đi men đồ vật.", "Nhặt vật nhỏ bằng ngón cái và ngón trỏ, tìm đồ vật bị giấu."] },
  { months: 18, label: "18 tháng", items: ["Đi không cần vịn.", "Chỉ để cho người lớn xem điều thú vị.", "Thử dùng thìa và uống cốc không nắp, có thể còn đổ."] },
  { months: 24, label: "2 tuổi", items: ["Chạy, đá bóng và bắt đầu đi cầu thang với hỗ trợ phù hợp.", "Dùng thìa tốt hơn.", "Chỉ vào hình trong sách khi được hỏi và chơi phối hợp nhiều đồ vật."] },
  { months: 36, label: "3 tuổi", items: ["Chú ý trẻ khác và tham gia chơi.", "Có thể hội thoại qua lại ít nhất vài lượt.", "Tự làm thêm các việc đơn giản như dùng nĩa hoặc mặc một số món đồ dễ."] },
  { months: 48, label: "4 tuổi", items: ["Chơi giả vờ nhiều vai và chủ động muốn chơi cùng trẻ khác.", "Cầm bút bằng ngón tay thay vì nắm cả bàn tay.", "Tự phục vụ thêm một số việc đơn giản, có thể mở một số nút áo."] },
  { months: 60, label: "5 tuổi", items: ["Biết tuân luật và luân phiên trong trò chơi đơn giản.", "Biết một số chữ cái và làm được việc nhà đơn giản phù hợp tuổi.", "Có thể nhảy lò cò một chân và cài một số nút."] },
] as const;

function ageBand(ageMonths: number) {
  if (ageMonths < 12) return { label: "9–11 tháng", sleep: "12–16 giờ/24 giờ", toothpaste: "Lượng kem fluoride rất nhỏ, khoảng hạt gạo", honey: "Không dùng mật ong trước 12 tháng" };
  if (ageMonths < 24) return { label: "12–23 tháng", sleep: "11–14 giờ/24 giờ", toothpaste: "Lượng kem fluoride rất nhỏ, khoảng hạt gạo", honey: "Từ 12 tháng có thể dùng như thực phẩm; không xem là thuốc chữa bệnh" };
  if (ageMonths < 36) return { label: "2 tuổi", sleep: "11–14 giờ/24 giờ", toothpaste: "Lượng kem fluoride rất nhỏ, khoảng hạt gạo", honey: "Có thể dùng như thực phẩm nếu phù hợp" };
  return { label: "3–5 tuổi", sleep: "10–13 giờ/24 giờ", toothpaste: "Lượng kem fluoride khoảng hạt đậu, người lớn hỗ trợ chải", honey: "Có thể dùng như thực phẩm nếu phù hợp" };
}

function nearestMilestone(months: number) {
  return [...MILESTONES].reverse().find((item) => months >= item.months)?.months ?? 9;
}

export default function EarlyChildhoodGuide({ ageMonths, sex }: { ageMonths: number | null; sex: Sex }) {
  const clampedAge = Math.max(9, Math.min(71, ageMonths ?? 9));
  const band = useMemo(() => ageBand(clampedAge), [clampedAge]);
  const [topic, setTopic] = useState<EarlyTopic>("overview");
  const [milestoneOverride, setMilestoneOverride] = useState<number | null>(null);
  const [sexOverride, setSexOverride] = useState<"male" | "female" | null>(null);
  const milestone = milestoneOverride ?? nearestMilestone(clampedAge);
  const viewSex = sexOverride ?? (sex === "female" ? "female" : "male");
  const currentMilestone = MILESTONES.find((item) => item.months === milestone) ?? MILESTONES[0];

  return <section className="ac-early" aria-label="Cẩm nang sức khỏe trẻ 9 tháng đến 5 tuổi">
    <header className="ac-early-head">
      <div><span className="hf-kicker">Khôi phục nội dung gốc · 9 tháng → 5 tuổi</span><h3>Cẩm nang chăm sóc trẻ nhỏ</h3><p>Ăn – ngủ – phát triển – khi bị bệnh – an toàn – chăm sóc riêng. Nội dung được tổ chức lại thành các nút chọn có trạng thái active rõ ràng.</p></div>
      <span className="ac-stage-badge">{band.label}</span>
    </header>

    <div className="ac-topic-tabs" role="tablist" aria-label="Chọn nhóm nội dung trẻ nhỏ">
      {TOPICS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={topic === item.id} className={topic === item.id ? "is-active" : ""} onClick={() => setTopic(item.id)}>{item.label}</button>)}
    </div>

    {topic === "overview" ? <div className="ac-card-grid">
      <article><span>Giấc ngủ</span><strong>{band.sleep}</strong><small>Tính cả ngủ ngày.</small></article>
      <article><span>Mật ong</span><strong>{clampedAge < 12 ? "Không dùng" : "Từ 12 tháng"}</strong><small>{band.honey}</small></article>
      <article><span>Răng miệng</span><strong>{clampedAge < 36 ? "Hạt gạo" : "Hạt đậu"}</strong><small>{band.toothpaste}</small></article>
      <article><span>Ưu tiên theo dõi</span><strong>Ăn/uống · thở · tỉnh táo</strong><small>Khi trẻ ốm, theo dõi diễn biến chung thay vì chỉ đếm số lần ho.</small></article>
    </div> : null}

    {topic === "nutrition" ? <div className="ac-content-grid">
      <article><h4>9–11 tháng</h4><ul><li>Sữa mẹ hoặc sữa công thức vẫn là nguồn dinh dưỡng quan trọng.</li><li>Ăn dặm tăng dần độ thô theo khả năng và luôn ngồi khi ăn.</li><li>Không dùng mật ong trước 12 tháng.</li><li>Không dùng sữa bò nguyên chất làm đồ uống chính trước 12 tháng.</li></ul></article>
      <article><h4>1–5 tuổi</h4><ul><li>Ưu tiên bữa ăn đa dạng: đạm, rau quả, tinh bột và chất béo phù hợp.</li><li>Nước là đồ uống chính; hạn chế đồ uống có đường và ăn vặt ngọt thường xuyên.</li><li>Không cho trẻ vừa chạy/đi vừa ăn.</li><li>Nho/cà chua bi cần cắt phù hợp; tránh hạt nguyên, bỏng ngô, kẹo cứng và miếng thức ăn cứng lớn.</li></ul></article>
      <div className="ac-safety-note"><strong>Chống hóc:</strong> trẻ nhỏ cần được quan sát trực tiếp khi ăn; người chăm sóc nên học sơ cứu hóc theo lứa tuổi.</div>
    </div> : null}

    {topic === "sleep" ? <div className="ac-content-grid">
      <article><h4>9–11 tháng</h4><p>Khoảng 12–16 giờ ngủ/24 giờ, gồm cả ngủ ngày.</p></article>
      <article><h4>1–2 tuổi</h4><p>Khoảng 11–14 giờ ngủ/24 giờ, gồm cả ngủ ngày.</p></article>
      <article><h4>3–5 tuổi</h4><p>Khoảng 10–13 giờ ngủ/24 giờ, gồm cả ngủ ngày.</p></article>
      <article><h4>Thói quen</h4><p>Giữ giờ ngủ tương đối đều; giảm màn hình trước ngủ; lưu ý ngáy to, ngưng thở bất thường hoặc buồn ngủ ban ngày kéo dài.</p></article>
    </div> : null}

    {topic === "development" ? <div>
      <div className="ac-milestone-tabs" role="tablist" aria-label="Chọn mốc phát triển">
        {MILESTONES.map((item) => <button key={item.months} type="button" role="tab" aria-selected={milestone === item.months} className={milestone === item.months ? "is-active" : ""} onClick={() => setMilestoneOverride(item.months)}>{item.label}</button>)}
      </div>
      <article className="ac-milestone-panel"><span>Mốc đang xem</span><h4>{currentMilestone.label}</h4><ul>{currentMilestone.items.map((item) => <li key={item}>{item}</li>)}</ul><p className="hf-muted">Mốc phát triển là điểm gợi ý để quan sát, không phải bài thi. Mất kỹ năng đã có hoặc chững phát triển rõ cần được trao đổi với nhân viên y tế.</p></article>
    </div> : null}

    {topic === "illness" ? <div className="ac-content-grid">
      <article><h4>Nên làm khi ho – sổ mũi – sốt</h4><ul><li>Vệ sinh mũi bằng dung dịch phù hợp và hỗ trợ uống/bú đủ dịch.</li><li>Chia nhỏ bữa khi trẻ khó chịu, theo dõi số lần tiểu và mức tỉnh táo.</li><li>Nếu cần đếm nhịp thở, đếm khi trẻ yên trong đủ 60 giây.</li><li>Dùng thuốc hạ sốt hoặc thuốc khác theo cân nặng và hướng dẫn chuyên môn/nhãn thuốc phù hợp tuổi.</li></ul></article>
      <article><h4>Không tự làm</h4><ul><li>Không tự dùng kháng sinh hoặc corticoid chỉ vì ho, sốt hay nước mũi đổi màu.</li><li>Không dùng thuốc ho/cảm OTC cho trẻ nhỏ nếu không có hướng dẫn phù hợp tuổi.</li><li>Không nhỏ tinh dầu, dầu gió, nước lá hoặc dung dịch tự pha không vô khuẩn vào mũi.</li><li>Không coi mẹo dân gian là điều trị viêm phổi hay bệnh nặng.</li></ul></article>
      <div className="ac-danger-note"><strong>Cần đánh giá y tế khẩn cấp</strong><span>Khi khó thở rõ/rút lõm ngực, tím môi, co giật, li bì/khó đánh thức, không uống được hoặc tình trạng xấu nhanh.</span></div>
    </div> : null}

    {topic === "safety" ? <div className="ac-card-grid">
      <article><span>Nước</span><strong>Quan sát liên tục</strong><small>Không rời mắt khi trẻ ở gần bồn tắm, xô/chậu, hồ bơi hoặc ao hồ.</small></article>
      <article><span>Thuốc & hóa chất</span><strong>Khóa ngoài tầm với</strong><small>Không gọi thuốc là “kẹo”; chú ý viên giặt và chất tẩy rửa.</small></article>
      <article><span>Ngã & bỏng</span><strong>Chặn – cố định – để xa</strong><small>Chặn cầu thang/cửa sổ, cố định đồ dễ đổ, để nước nóng và dây điện ngoài tầm tay.</small></article>
      <article><span>Đường bộ</span><strong>Thiết bị bảo vệ phù hợp</strong><small>Dùng ghế/thiết bị bảo vệ theo tuổi, cân nặng, phương tiện và quy định địa phương.</small></article>
    </div> : null}

    {topic === "sex-care" ? <div>
      <div className="ac-sex-tabs" role="tablist" aria-label="Chọn nội dung chăm sóc theo giới tính">
        <button type="button" role="tab" aria-selected={viewSex === "male"} className={viewSex === "male" ? "is-active" : ""} onClick={() => setSexOverride("male")}>Bé trai</button>
        <button type="button" role="tab" aria-selected={viewSex === "female"} className={viewSex === "female" ? "is-active" : ""} onClick={() => setSexOverride("female")}>Bé gái</button>
      </div>
      {viewSex === "male" ? <article className="ac-milestone-panel"><h4>Chăm sóc bé trai</h4><ul><li>Nếu chưa cắt bao quy đầu, chỉ rửa bên ngoài; không cố tuột bao quy đầu.</li><li>Khi bao quy đầu tự tuột dễ dàng, hướng dẫn kéo nhẹ, rửa nước rồi đưa da trở lại vị trí.</li><li>Cần đánh giá khi tiểu rất khó, đau/sưng rõ, hoặc bao quy đầu bị kẹt sau khi kéo xuống.</li><li>Nếu một bên bìu luôn trống hoặc có sưng đau cấp tính ở bìu, cần đánh giá y tế.</li></ul></article> : <article className="ac-milestone-panel"><h4>Chăm sóc bé gái</h4><ul><li>Làm sạch nhẹ vùng âm hộ bằng nước; tránh sản phẩm thơm khi đang kích ứng.</li><li>Khi tự đi vệ sinh, dạy lau từ trước ra sau.</li><li>Thay quần áo ướt sớm và ưu tiên quần áo vùng đáy thoáng.</li><li>Cần đánh giá khi tiểu đau, sốt không rõ nguyên nhân, dịch hôi/bất thường, chảy máu hoặc đau kéo dài.</li></ul></article>}
    </div> : null}

    <footer className="ac-source-note">Nguồn nền của phần khôi phục: WHO Child Growth Standards/IMCI, CDC developmental milestones & choking prevention, AAP/HealthyChildren, AAPD và AASM. Nội dung là cẩm nang theo dõi, không thay thế khám hoặc chẩn đoán.</footer>
  </section>;
}
