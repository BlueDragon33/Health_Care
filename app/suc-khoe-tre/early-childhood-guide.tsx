"use client";

import { useMemo, useState } from "react";

type EarlyTopic = "overview" | "nutrition" | "sleep" | "movement" | "oral" | "development" | "illness" | "safety" | "sex-care";
type Sex = "male" | "female" | "";

const TOPICS: readonly { id: EarlyTopic; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "nutrition", label: "Ăn & uống" },
  { id: "sleep", label: "Giấc ngủ" },
  { id: "movement", label: "Vận động" },
  { id: "oral", label: "Răng miệng" },
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
  if (ageMonths < 12) return { label: "9–11 tháng", sleep: "12–16 giờ/24 giờ", toothpaste: "Kem fluoride: lượng rất nhỏ, khoảng hạt gạo", honey: "Không dùng mật ong trước 12 tháng" };
  if (ageMonths < 24) return { label: "12–23 tháng", sleep: "11–14 giờ/24 giờ", toothpaste: "Kem fluoride: lượng rất nhỏ, khoảng hạt gạo", honey: "Từ 12 tháng có thể dùng như thực phẩm; không xem là thuốc chữa bệnh" };
  if (ageMonths < 36) return { label: "2 tuổi", sleep: "11–14 giờ/24 giờ", toothpaste: "Kem fluoride: lượng rất nhỏ, khoảng hạt gạo", honey: "Có thể dùng như thực phẩm nếu phù hợp" };
  return { label: "3–5 tuổi", sleep: "10–13 giờ/24 giờ", toothpaste: "Kem fluoride: lượng khoảng hạt đậu, người lớn hỗ trợ chải", honey: "Có thể dùng như thực phẩm nếu phù hợp" };
}

function nearestMilestone(months: number) {
  return [...MILESTONES].reverse().find((item) => months >= item.months)?.months ?? 9;
}

function fastBreathingText(months: number) {
  if (months < 12) return "Khi có ho/khó thở: ≥50 lần/phút lúc trẻ yên là ngưỡng thở nhanh IMCI cho 2–<12 tháng.";
  if (months < 60) return "Khi có ho/khó thở: ≥40 lần/phút lúc trẻ yên là ngưỡng thở nhanh IMCI cho 12 tháng–<5 tuổi.";
  return "Từ đủ 5 tuổi, không áp ngưỡng IMCI 2 tháng–<5 tuổi; đánh giá khó thở cần theo hướng dẫn phù hợp tuổi.";
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
      <div><span className="hf-kicker">Nội dung khôi phục & nâng cấp · 9 tháng → 5 tuổi</span><h3>Cẩm nang chăm sóc trẻ nhỏ</h3><p>Ăn – ngủ – vận động – răng miệng – phát triển – khi bị bệnh – an toàn – chăm sóc riêng. Mỗi nhóm là nút chọn có trạng thái active rõ ràng.</p></div>
      <span className="ac-stage-badge">{band.label}</span>
    </header>

    <div className="ac-topic-tabs" role="tablist" aria-label="Chọn nhóm nội dung trẻ nhỏ">
      {TOPICS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={topic === item.id} className={topic === item.id ? "is-active" : ""} onClick={() => setTopic(item.id)}>{item.label}</button>)}
    </div>

    {topic === "overview" ? <div className="ac-card-grid">
      <article><span>Giấc ngủ</span><strong>{band.sleep}</strong><small>Tính cả ngủ ngày; xem xu hướng chứ không chấm điểm một đêm.</small></article>
      <article><span>Mật ong</span><strong>{clampedAge < 12 ? "Không dùng" : "Từ 12 tháng"}</strong><small>{band.honey}</small></article>
      <article><span>Răng miệng</span><strong>{clampedAge < 36 ? "Hạt gạo" : "Hạt đậu"}</strong><small>{band.toothpaste}</small></article>
      <article><span>Khi ốm</span><strong>Ăn/uống · thở · tỉnh táo</strong><small>Theo dõi toàn trạng và diễn biến, không chỉ số lần ho hoặc nhiệt độ.</small></article>
    </div> : null}

    {topic === "nutrition" ? <div className="ac-content-grid">
      <article><h4>9–11 tháng</h4><ul><li>Tiếp tục bú mẹ nếu đang bú; nếu dùng sữa công thức, duy trì theo hướng dẫn phù hợp.</li><li>WHO: thức ăn bổ sung thường tăng lên 3–4 bữa/ngày ở 9–11 tháng, kèm bú; có thể thêm 1–2 bữa phụ theo nhu cầu.</li><li>Tăng dần độ đặc, độ thô và đa dạng theo kỹ năng ăn; cho trẻ cơ hội cầm thức ăn mềm phù hợp.</li><li>Ưu tiên khẩu phần đa dạng có thực phẩm nguồn động vật phù hợp, rau/trái cây; hạt/đậu phải ở dạng không gây hóc.</li><li>Không dùng mật ong trước 12 tháng; không dùng sữa bò nguyên chất làm đồ uống chính trước 12 tháng.</li></ul></article>
      <article><h4>12–23 tháng</h4><ul><li>WHO: thường 3–4 bữa/ngày và 1–2 bữa phụ theo nhu cầu; tiếp tục bú mẹ đến 2 tuổi hoặc lâu hơn nếu mẹ và trẻ mong muốn.</li><li>Chuyển dần sang thức ăn gia đình, điều chỉnh kích thước/độ mềm để trẻ ăn an toàn.</li><li>Thực hành responsive feeding: nhận biết dấu đói/no, hỗ trợ nhưng không ép ăn.</li><li>Từ 12 tháng có thể dùng sữa bò thanh trùng phù hợp như một phần khẩu phần, nhưng không để sữa thay thế bữa ăn đa dạng.</li></ul></article>
      <article><h4>2–5 tuổi</h4><ul><li>Ăn cùng gia đình với thực phẩm đa dạng, ưu tiên thực phẩm ít chế biến.</li><li>Nước là đồ uống thường ngày; hạn chế đồ uống có đường và đồ ăn ngọt lặp lại nhiều lần trong ngày.</li><li>Cho trẻ tham gia lựa chọn/chuẩn bị món phù hợp tuổi; không dùng ép ăn hoặc cân nặng làm thưởng/phạt.</li><li>Không tự đặt chế độ ăn kiêng giảm cân cho trẻ từ ứng dụng.</li></ul></article>
      <article><h4>Chống hóc</h4><ul><li>Trẻ ngồi khi ăn và luôn có người lớn quan sát.</li><li>Cắt nhỏ nho/cà chua bi; cắt thực phẩm hình trụ thành miếng mỏng/nhỏ phù hợp.</li><li>Tránh hạt nguyên, bỏng ngô, kẹo cứng, miếng thịt/phô mai lớn và thìa đầy bơ hạt.</li><li>Không cho trẻ vừa chạy, nằm hoặc chơi vừa ăn.</li></ul></article>
      <div className="ac-safety-note"><strong>Nguyên tắc:</strong> đa dạng + an toàn + responsive feeding. Không dùng nhật ký ăn để kết luận thiếu chất hoặc ép trẻ ăn.</div>
    </div> : null}

    {topic === "sleep" ? <div className="ac-content-grid">
      <article><h4>9–11 tháng</h4><p>AASM: khoảng 12–16 giờ ngủ/24 giờ, gồm cả ngủ ngày.</p></article>
      <article><h4>1–2 tuổi</h4><p>AASM: khoảng 11–14 giờ ngủ/24 giờ, gồm cả ngủ ngày.</p></article>
      <article><h4>3–5 tuổi</h4><p>AASM: khoảng 10–13 giờ ngủ/24 giờ, gồm cả ngủ ngày.</p></article>
      <article><h4>Thói quen & dấu hiệu cần chú ý</h4><ul><li>Giữ giờ ngủ/thức tương đối ổn định và có trình tự trước ngủ đơn giản.</li><li>Giảm màn hình và hoạt động kích thích sát giờ ngủ.</li><li>Ngáy to thường xuyên, ngưng thở bất thường, khó ngủ kéo dài hoặc buồn ngủ ban ngày rõ cần được trao đổi với nhân viên y tế.</li></ul></article>
    </div> : null}

    {topic === "movement" ? <div className="ac-content-grid">
      <article><h4>9–11 tháng</h4><ul><li>WHO: cho trẻ vận động nhiều lần trong ngày, chủ yếu bằng chơi tương tác trên sàn.</li><li>Cho không gian an toàn để lăn, bò, chuyển tư thế, với đồ vật phù hợp.</li><li>Không dùng thiết bị giữ trẻ cố định lâu để thay thế vận động tự do.</li></ul></article>
      <article><h4>1–2 tuổi</h4><ul><li>WHO khuyến nghị ít nhất 180 phút hoạt động thể chất đa dạng ở mọi cường độ, trải trong ngày; nhiều hơn là tốt.</li><li>Ưu tiên đi, chạy, leo trèo an toàn, chơi bóng, nhảy múa và chơi ngoài trời.</li></ul></article>
      <article><h4>3–4 tuổi</h4><ul><li>Ít nhất 180 phút hoạt động thể chất/ngày; trong đó ít nhất 60 phút ở mức vừa đến mạnh.</li><li>Phối hợp chạy, nhảy, leo, ném/bắt và trò chơi thăng bằng theo khả năng.</li></ul></article>
      <article><h4>5 tuổi</h4><ul><li>Bắt đầu nằm trong nhóm WHO 5–17 tuổi: trung bình ít nhất 60 phút/ngày hoạt động mức vừa đến mạnh trong tuần.</li><li>Vận động nên chủ yếu là chơi vui, đa dạng và phù hợp kỹ năng; không luyện hình thể người lớn.</li></ul></article>
    </div> : null}

    {topic === "oral" ? <div className="ac-content-grid">
      <article><h4>Từ chiếc răng đầu tiên</h4><ul><li>AAPD: chải răng 2 lần/ngày bằng bàn chải mềm phù hợp tuổi và kem có fluoride.</li><li>Dưới 3 tuổi: lượng rất nhỏ, cỡ smear/hạt gạo.</li><li>3–6 tuổi: không quá lượng cỡ hạt đậu; người lớn lấy kem và trực tiếp chải/hỗ trợ.</li></ul></article>
      <article><h4>Khám & phòng sâu răng</h4><ul><li>AAPD khuyến nghị lần khám nha khoa đầu tiên chậm nhất vào sinh nhật 1 tuổi.</li><li>Tần suất tái khám tùy nguy cơ sâu răng và tư vấn nha sĩ; không bắt buộc mọi trẻ một lịch giống nhau.</li><li>Hạn chế ăn/uống ngọt lặp lại nhiều lần trong ngày, đặc biệt đồ uống ngọt trong bình/cốc kéo dài.</li></ul></article>
      <div className="ac-safety-note"><strong>Fluoride:</strong> “nhiều hơn” không tốt hơn; người lớn kiểm soát lượng kem để giảm nuốt quá mức.</div>
    </div> : null}

    {topic === "development" ? <div>
      <div className="ac-milestone-tabs" role="tablist" aria-label="Chọn mốc phát triển">
        {MILESTONES.map((item) => <button key={item.months} type="button" role="tab" aria-selected={milestone === item.months} className={milestone === item.months ? "is-active" : ""} onClick={() => setMilestoneOverride(item.months)}>{item.label}</button>)}
      </div>
      <article className="ac-milestone-panel"><span>Mốc đang xem</span><h4>{currentMilestone.label}</h4><ul>{currentMilestone.items.map((item) => <li key={item}>{item}</li>)}</ul><p className="hf-muted">Mốc CDC là điểm gợi ý để quan sát, không phải bài thi. Nếu trẻ mất kỹ năng đã có, hoặc cha mẹ lo rõ về phát triển, nên trao đổi với nhân viên y tế thay vì chờ “tự lớn sẽ hết”.</p></article>
    </div> : null}

    {topic === "illness" ? <div className="ac-content-grid">
      <article><h4>Nên làm khi ho – sổ mũi – sốt</h4><ul><li>Hỗ trợ uống/bú đủ dịch; khi bệnh có thể chia nhỏ bữa và ưu tiên thức ăn mềm, quen thuộc.</li><li>Vệ sinh mũi bằng dung dịch phù hợp; hút mũi nhẹ chỉ khi dịch làm trẻ khó bú/ăn hoặc khó thở bằng mũi.</li><li>Đếm nhịp thở khi trẻ yên, đủ 60 giây nếu đang đánh giá ho/khó thở.</li><li>Theo dõi khả năng uống/bú, số lần tiểu, mức tỉnh táo, khó thở và diễn biến chung.</li></ul></article>
      <article><h4>Ngưỡng IMCI cần nhớ</h4><p>{fastBreathingText(clampedAge)}</p><p className="hf-muted">Đây là ngưỡng sàng lọc trong bối cảnh ho/khó thở, không phải chẩn đoán viêm phổi chỉ dựa vào nhịp thở.</p></article>
      <article><h4>Không tự làm</h4><ul><li>Không tự dùng kháng sinh hoặc corticoid chỉ vì ho, sốt, đờm hay nước mũi đổi màu.</li><li>Không dùng thuốc ho/cảm OTC cho trẻ nhỏ nếu không có hướng dẫn phù hợp tuổi.</li><li>Không nhỏ tinh dầu, dầu gió, nước lá hoặc dung dịch tự pha không vô khuẩn vào mũi.</li><li>Không coi mẹo dân gian là điều trị bệnh nặng.</li></ul></article>
      <div className="ac-danger-note"><strong>Cần đánh giá y tế khẩn cấp</strong><span>Khi khó thở rõ/rút lõm ngực, tím môi, co giật, li bì/khó đánh thức, không uống được hoặc tình trạng xấu nhanh.</span></div>
    </div> : null}

    {topic === "safety" ? <div className="ac-card-grid">
      <article><span>Nước</span><strong>Quan sát liên tục</strong><small>Không rời mắt khi trẻ ở gần bồn tắm, xô/chậu, hồ bơi hoặc ao hồ; đuối nước thường diễn ra nhanh và im lặng.</small></article>
      <article><span>Thuốc & hóa chất</span><strong>Khóa ngoài tầm với</strong><small>Thuốc, viên giặt, pin cúc áo, chất tẩy và hóa chất cần được cất khóa; không gọi thuốc là “kẹo”.</small></article>
      <article><span>Ngã & bỏng</span><strong>Chặn – cố định – để xa</strong><small>Chặn cầu thang/cửa sổ, cố định đồ dễ đổ, tránh nước nóng/nồi chảo/dây điện trong tầm với.</small></article>
      <article><span>Đường bộ</span><strong>Thiết bị bảo vệ phù hợp</strong><small>Dùng ghế/thiết bị bảo vệ phù hợp tuổi, cân nặng, phương tiện và quy định địa phương; không để trẻ một mình trong xe.</small></article>
      <article><span>Hóc</span><strong>Ăn có người lớn quan sát</strong><small>Chuẩn bị thức ăn đúng kích thước/độ mềm và học sơ cứu hóc theo lứa tuổi.</small></article>
      <article><span>Ngủ & môi trường</span><strong>Không thay hướng dẫn an toàn ngủ bằng mẹo</strong><small>Với trẻ dưới 1 tuổi, các lựa chọn chỗ ngủ phải tuân hướng dẫn an toàn trẻ sơ sinh phù hợp, không dựa vào gối/chặn tự chế.</small></article>
    </div> : null}

    {topic === "sex-care" ? <div>
      <div className="ac-sex-tabs" role="tablist" aria-label="Chọn nội dung chăm sóc theo giới tính">
        <button type="button" role="tab" aria-selected={viewSex === "male"} className={viewSex === "male" ? "is-active" : ""} onClick={() => setSexOverride("male")}>Bé trai</button>
        <button type="button" role="tab" aria-selected={viewSex === "female"} className={viewSex === "female" ? "is-active" : ""} onClick={() => setSexOverride("female")}>Bé gái</button>
      </div>
      {viewSex === "male" ? <article className="ac-milestone-panel"><h4>Chăm sóc bé trai</h4><ul><li>Nếu chưa cắt bao quy đầu, chỉ rửa bên ngoài; không cố tuột bao quy đầu.</li><li>Khi bao quy đầu tự tuột dễ dàng, hướng dẫn kéo nhẹ, rửa nước rồi đưa da trở lại vị trí.</li><li>Cần đánh giá khi tiểu rất khó, đau/sưng rõ, hoặc bao quy đầu bị kẹt sau khi kéo xuống.</li><li>Nếu một bên bìu luôn trống hoặc có sưng đau cấp tính ở bìu, cần đánh giá y tế.</li></ul></article> : <article className="ac-milestone-panel"><h4>Chăm sóc bé gái</h4><ul><li>Làm sạch nhẹ vùng âm hộ bằng nước; tránh sản phẩm thơm khi đang kích ứng.</li><li>Khi tự đi vệ sinh, dạy lau từ trước ra sau.</li><li>Thay quần áo ướt sớm và ưu tiên quần áo vùng đáy thoáng.</li><li>Cần đánh giá khi tiểu đau, sốt không rõ nguyên nhân, dịch hôi/bất thường, chảy máu hoặc đau kéo dài.</li></ul></article>}
    </div> : null}

    <footer className="ac-source-note">Nền tảng cập nhật: WHO complementary feeding 6–23 tháng, WHO IMCI, WHO physical activity/sedentary guidance, CDC developmental milestones & choking prevention, AAPD fluoride/oral care và AASM pediatric sleep. Nội dung là cẩm nang theo dõi, không thay thế khám hoặc chẩn đoán.</footer>
  </section>;
}
