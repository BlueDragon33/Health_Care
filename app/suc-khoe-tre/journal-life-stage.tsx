"use client";

import type { HealthLifeStage, HealthLifeStageId } from "./health-age-scope";

export type JournalStageConfig = {
  title: string;
  actorLabel: string;
  feelingPrompt: string;
  notePrompt: string;
  observationLabel: string;
  observations: readonly string[];
  safety: string;
};

const JOURNAL_STAGE_CONFIG: Record<HealthLifeStageId, JournalStageConfig> = {
  "infant-9-11m": {
    title: "9–11 tháng · Nhật ký quan sát của người chăm sóc",
    actorLabel: "Người chăm sóc ghi lại điều quan sát được",
    feelingPrompt: "Tình trạng chung hôm nay",
    notePrompt: "Ví dụ: bú/ăn, ngủ, mức tỉnh táo, chơi, số lần nôn, phân, nước tiểu hoặc thay đổi khác mà người chăm sóc nhận thấy.",
    observationLabel: "Dấu hiệu / thay đổi đã quan sát",
    observations: ["Ho", "Sổ mũi", "Sốt", "Nôn", "Tiêu chảy", "Bú/ăn kém", "Ít tiểu", "Khó thở", "Lừ đừ / khó đánh thức", "Phát ban", "Khác"],
    safety: "Nhật ký chỉ ghi quan sát. Khó thở, tím tái, co giật, lừ đừ khó đánh thức, bỏ bú/ăn rõ, mất nước hoặc tình trạng xấu nhanh cần được đánh giá y tế phù hợp; không chờ ứng dụng tự kết luận.",
  },
  "toddler-12-23m": {
    title: "12–23 tháng · Nhật ký quan sát & hành vi thường ngày",
    actorLabel: "Người chăm sóc ghi lại biểu hiện và thay đổi so với thường ngày",
    feelingPrompt: "Tình trạng chung hôm nay",
    notePrompt: "Ví dụ: ăn/uống, ngủ, chơi, đi lại, phân/tiểu, quấy khóc, đau ở đâu khi trẻ biểu đạt được, hoặc điều khác thường.",
    observationLabel: "Dấu hiệu / thay đổi đã quan sát",
    observations: ["Ho", "Sổ mũi", "Sốt", "Nôn", "Tiêu chảy", "Ăn/uống kém", "Đau bụng", "Khó thở", "Mệt / ít chơi", "Phát ban", "Khác"],
    safety: "Không dùng danh sách này để tự chẩn đoán. Nếu trẻ khó thở, co giật, lừ đừ, mất nước, đau nhiều, chấn thương đáng lo hoặc xấu nhanh, cần đánh giá y tế phù hợp.",
  },
  "early-childhood-2-5y": {
    title: "2–5 tuổi · Nhật ký triệu chứng & sinh hoạt",
    actorLabel: "Người chăm sóc ghi, có thể thêm lời trẻ mô tả khi trẻ nói được",
    feelingPrompt: "Hôm nay trẻ nhìn chung thế nào?",
    notePrompt: "Ghi triệu chứng, ăn/uống, ngủ, vận động/chơi, đi học, thuốc đã dùng theo chỉ định và điều gì làm trẻ dễ chịu hoặc khó chịu hơn.",
    observationLabel: "Triệu chứng / thay đổi đã ghi",
    observations: ["Đau đầu", "Đau bụng", "Ho", "Sổ mũi", "Đau họng", "Sốt", "Nôn", "Tiêu chảy", "Mệt / ít chơi", "Phát ban", "Khác"],
    safety: "Nhật ký hỗ trợ nhớ diễn biến, không thay thế khám bệnh. Triệu chứng nặng, kéo dài, xấu nhanh hoặc khiến người chăm sóc lo lắng cần được đánh giá phù hợp.",
  },
  "school-age-6-8y": {
    title: "6–8 tuổi · Nhật ký sức khỏe cùng người chăm sóc",
    actorLabel: "Trẻ có thể mô tả, người chăm sóc hỗ trợ ghi rõ diễn biến",
    feelingPrompt: "Hôm nay trẻ cảm thấy thế nào?",
    notePrompt: "Ghi thời điểm bắt đầu, triệu chứng, ăn/uống, ngủ, học/chơi và ảnh hưởng tới sinh hoạt; tránh tự gán tên bệnh từ một triệu chứng đơn lẻ.",
    observationLabel: "Triệu chứng / thay đổi đã ghi",
    observations: ["Đau đầu", "Đau bụng", "Ho", "Sổ mũi", "Đau họng", "Sốt", "Mệt", "Chóng mặt", "Buồn nôn / nôn", "Phát ban", "Khác"],
    safety: "Không tự chẩn đoán hoặc tự kê thuốc từ nhật ký. Nếu có khó thở, đau dữ dội, ngất, co giật, chấn thương nghiêm trọng hoặc diễn biến xấu nhanh, cần hỗ trợ y tế phù hợp.",
  },
  foundation: {
    title: "9–10 tuổi · Nhật ký sức khỏe & thói quen",
    actorLabel: "Trẻ có thể tự mô tả, người lớn hỗ trợ khi cần",
    feelingPrompt: "Hôm nay cảm thấy thế nào?",
    notePrompt: "Ghi triệu chứng, thời điểm, giấc ngủ, ăn uống, vận động, học tập và điều gì khác thường. Không dùng nhật ký để tự chẩn đoán.",
    observationLabel: "Triệu chứng / thay đổi đã ghi",
    observations: ["Đau đầu", "Đau bụng", "Ho", "Sổ mũi", "Đau họng", "Sốt", "Mệt", "Chóng mặt", "Buồn nôn", "Đau cơ / khớp", "Khác"],
    safety: "Nếu triệu chứng nặng, kéo dài, tái diễn hoặc ảnh hưởng rõ đến sinh hoạt, cần trao đổi với người lớn tin cậy và nhân viên y tế phù hợp.",
  },
  preteen: {
    title: "11–12 tuổi · Nhật ký cơ thể, cảm xúc & triệu chứng",
    actorLabel: "Khuyến khích trẻ tự mô tả bằng ngôn ngữ của mình",
    feelingPrompt: "Hôm nay cảm thấy thế nào?",
    notePrompt: "Có thể ghi triệu chứng, giấc ngủ, học tập, vận động, thay đổi cơ thể và cảm xúc. Tránh biến nhật ký thành điểm số sức khỏe hoặc hình thể.",
    observationLabel: "Triệu chứng / thay đổi đã ghi",
    observations: ["Đau đầu", "Đau bụng", "Ho", "Đau họng", "Sốt", "Mệt", "Chóng mặt", "Buồn nôn", "Đau cơ / khớp", "Khó ngủ", "Khác"],
    safety: "Nhật ký không chẩn đoán bệnh hay đánh giá mức trưởng thành. Triệu chứng đáng lo, đau nhiều, khó thở, ngất hoặc khó khăn cảm xúc kéo dài cần được chia sẻ với người lớn tin cậy/chuyên môn phù hợp.",
  },
  "early-adolescent": {
    title: "13–15 tuổi · Nhật ký sức khỏe cá nhân",
    actorLabel: "Ưu tiên người trẻ tự ghi; tôn trọng riêng tư trong phạm vi an toàn",
    feelingPrompt: "Hôm nay cảm thấy thế nào?",
    notePrompt: "Ghi diễn biến triệu chứng, ngủ, học, vận động, chu kỳ/thay đổi cơ thể nếu muốn, cảm xúc và yếu tố liên quan. Không dùng nhật ký để tự kê thuốc hay tự chẩn đoán.",
    observationLabel: "Triệu chứng / thay đổi đã ghi",
    observations: ["Đau đầu", "Đau bụng", "Đau họng", "Sốt", "Mệt", "Chóng mặt", "Buồn nôn", "Đau cơ / khớp", "Khó ngủ", "Căng thẳng", "Khác"],
    safety: "Khó thở, ngất, đau dữ dội, chấn thương nghiêm trọng, triệu chứng xấu nhanh hoặc khủng hoảng cảm xúc cần được hỗ trợ y tế/người lớn tin cậy phù hợp; ứng dụng không tự đưa ra chẩn đoán.",
  },
  "late-adolescent": {
    title: "16–18 tuổi · Nhật ký tự quản lý sức khỏe",
    actorLabel: "Người trẻ chủ động ghi để chuẩn bị trao đổi khi khám hoặc tự quản lý khi học xa",
    feelingPrompt: "Hôm nay cảm thấy thế nào?",
    notePrompt: "Ghi thời điểm, triệu chứng, mức ảnh hưởng, thuốc đã dùng theo chỉ định, dị ứng liên quan, ngủ, ăn uống và câu hỏi muốn trao đổi khi khám.",
    observationLabel: "Triệu chứng / thay đổi đã ghi",
    observations: ["Đau đầu", "Đau bụng", "Đau họng", "Sốt", "Mệt", "Chóng mặt", "Buồn nôn", "Đau cơ / khớp", "Khó ngủ", "Căng thẳng", "Khác"],
    safety: "Nhật ký phục vụ ghi nhớ và trao đổi, không thay thế đánh giá chuyên môn hoặc tự kê đơn. Tình trạng cấp tính/nặng hoặc khủng hoảng cảm xúc cần được hỗ trợ phù hợp ngay.",
  },
};

const FALLBACK_CONFIG: JournalStageConfig = {
  title: "Nhật ký sức khỏe theo tuổi",
  actorLabel: "Cần ngày sinh để chọn cách ghi phù hợp",
  feelingPrompt: "Tình trạng chung hôm nay",
  notePrompt: "Ghi điều đã quan sát hoặc cảm nhận, thời điểm và diễn biến.",
  observationLabel: "Triệu chứng / thay đổi đã ghi",
  observations: ["Ho", "Sổ mũi", "Sốt", "Đau", "Mệt", "Khác"],
  safety: "Nhật ký không phải công cụ chẩn đoán, kê đơn hoặc quyết định trì hoãn chăm sóc y tế cần thiết.",
};

export function journalConfigForLifeStage(stage: HealthLifeStage | null): JournalStageConfig {
  return stage ? JOURNAL_STAGE_CONFIG[stage.id] : FALLBACK_CONFIG;
}

export function journalObservationOptionsForLifeStage(stage: HealthLifeStage | null): readonly string[] {
  return journalConfigForLifeStage(stage).observations;
}

export default function JournalStagePanel({ stage }: { stage: HealthLifeStage | null }) {
  const config = journalConfigForLifeStage(stage);
  return <section className="hf-panel hf-info-panel" data-journal-life-stage={stage?.id ?? "unknown"}>
    <div className="hf-panel-head">
      <div><span className="hf-kicker">Nhật ký theo giai đoạn tuổi</span><h3>{config.title}</h3></div>
      <small>{stage?.shortLabel ?? "Chưa xác định tuổi"}</small>
    </div>
    <p><strong>{config.actorLabel}.</strong> {config.notePrompt}</p>
    <div className="hf-safety-note"><strong>Ranh giới an toàn:</strong> {config.safety}</div>
  </section>;
}
