export type HealthDomainMaturity = "operational" | "partial" | "framework";

export type HealthDomainImplementation = {
  maturity: HealthDomainMaturity;
  label: string;
  note: string;
  evidence: readonly string[];
};

/**
 * Trạng thái triển khai phải phản ánh đúng runtime đang chạy, không phản ánh
 * mong muốn tương lai. Mỗi miền trong HEALTH_DOMAINS phải có đúng một entry.
 *
 * operational: đã có luồng nhập/xem/lưu thực tế trong Web App;
 * partial: đã có một phần luồng thực tế nhưng chưa phủ đủ capability của miền;
 * framework: mới có contract/catalog/guardrail, chưa được coi là tính năng hoàn chỉnh.
 */
export const HEALTH_DOMAIN_IMPLEMENTATION = {
  "growth-development": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có timeline số đo, WHO BMI-for-age 9–18 và biểu đồ xu hướng.",
    evidence: ["health-framework.tsx", "growth-trend.tsx", "who-bmi-reference.ts"],
  },
  "vital-signs-screening-results": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có vault riêng cho dấu hiệu sinh tồn và kết quả sàng lọc theo hồ sơ.",
    evidence: ["vital-signs-screening.tsx", "health-record-contracts.ts"],
  },
  "nutrition-hydration": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có checklist nhóm thực phẩm, nước, nhật ký bữa ăn và nội dung theo giai đoạn tuổi.",
    evidence: ["health-framework.tsx", "nutrition-stage-panel.tsx", "weekly-health-summary.tsx"],
  },
  "physical-activity": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có nhật ký phút/loại vận động và tổng hợp theo tuần.",
    evidence: ["health-framework.tsx", "weekly-health-summary.tsx"],
  },
  "injury-sports-musculoskeletal": {
    maturity: "framework",
    label: "Đã khóa khung",
    note: "Đã có record contract và guardrail; chưa có màn hình episode chấn thương/return-to-activity chuyên biệt.",
    evidence: ["health-record-contracts.ts", "health-domain-catalog.ts"],
  },
  "sleep-recovery": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có giờ ngủ/thức dậy, thời lượng và tổng hợp thói quen theo tuần.",
    evidence: ["health-framework.tsx", "weekly-health-summary.tsx"],
  },
  "puberty-body-changes": {
    maturity: "framework",
    label: "Đã khóa khung",
    note: "Đã có privacy boundary và secure vault nền; chưa phát hành module dậy thì/chu kỳ chuyên biệt.",
    evidence: ["health-domain-catalog.ts", "health-privacy-contracts.ts", "secure-vault-center.tsx"],
  },
  "mental-emotional": {
    maturity: "partial",
    label: "Đang hoàn thiện",
    note: "Đã có check-in cảm nhận và nhật ký riêng theo ngày; chưa có luồng yếu tố bảo vệ/kế hoạch tìm hỗ trợ chuyên biệt.",
    evidence: ["health-framework.tsx", "health-timeline.tsx", "private-sensitive-notes.tsx"],
  },
  "school-function-learning-neurodevelopment": {
    maturity: "framework",
    label: "Đã khóa khung",
    note: "Đã có record contract; chưa có module theo dõi chức năng học đường/chú ý/hỗ trợ trường học riêng.",
    evidence: ["health-record-contracts.ts", "health-domain-catalog.ts"],
  },
  "oral-skin-hygiene": {
    maturity: "partial",
    label: "Đang hoàn thiện",
    note: "Đã có checklist răng miệng/vệ sinh; phần da-tóc và lịch nha khoa chuyên sâu chưa tách module riêng.",
    evidence: ["health-framework.tsx", "preventive-care-records.tsx"],
  },
  "eyes-hearing-school": {
    maturity: "partial",
    label: "Đang hoàn thiện",
    note: "Đã có nghỉ mắt và lưu kết quả thị lực/thính lực; tư thế/cặp sách/màn hình chưa có timeline riêng.",
    evidence: ["health-framework.tsx", "vital-signs-screening.tsx"],
  },
  "preventive-care": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có hồ sơ phòng ngừa, lịch khám/tiêm và nhắc việc; không hard-code lịch quốc gia khi chưa có nguồn phù hợp.",
    evidence: ["preventive-care-records.tsx", "reminder-manager.tsx", "health-evidence.ts"],
  },
  "symptoms-illness-first-aid": {
    maturity: "partial",
    label: "Đang hoàn thiện",
    note: "Đã có nhật ký triệu chứng và timeline; bộ episode bệnh cấp/sơ cứu chuyên biệt chưa được phát hành đầy đủ trong shell mới.",
    evidence: ["health-framework.tsx", "health-timeline.tsx", "health-record-contracts.ts"],
  },
  "chronic-conditions-care-plans": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có bệnh nền, tiền sử và kế hoạch chăm sóc trong secure vault theo hồ sơ.",
    evidence: ["chronic-conditions-care-plans.tsx", "health-record-contracts.ts"],
  },
  "medications-allergies": {
    maturity: "operational",
    label: "Đang vận hành",
    note: "Đã có danh sách thuốc/dị ứng, lịch sử và dữ liệu lưu trong secure vault.",
    evidence: ["medications-allergies.tsx", "health-record-contracts.ts"],
  },
  "digital-wellbeing": {
    maturity: "partial",
    label: "Đang hoàn thiện",
    note: "Đã có nghỉ mắt và liên hệ với giấc ngủ; chưa có nhật ký thời gian màn hình/an toàn số chuyên biệt.",
    evidence: ["health-framework.tsx", "health-domain-catalog.ts"],
  },
  "safety-risk-prevention": {
    maturity: "framework",
    label: "Đã khóa khung",
    note: "Đã có domain/guardrail; chưa có checklist an toàn và kế hoạch người lớn tin cậy trong runtime chính.",
    evidence: ["health-domain-catalog.ts", "health-tracking-catalog.ts"],
  },
  "substance-use-risk-behaviour": {
    maturity: "framework",
    label: "Đã khóa khung",
    note: "Đã có contract riêng tư và tracking adapter; chưa bật screening/check-in vì cần xác minh tuổi, ngôn ngữ, bản quyền và hướng xử trí.",
    evidence: ["health-record-contracts.ts", "health-domain-catalog.ts", "health-tracking-catalog.ts"],
  },
  "relationships-reproductive-health": {
    maturity: "framework",
    label: "Đã khóa khung",
    note: "Đã định nghĩa phạm vi/guardrail theo tuổi; chưa phát hành module giáo dục và dữ liệu riêng tư chuyên biệt.",
    evidence: ["health-domain-catalog.ts", "health-privacy-contracts.ts"],
  },
  "family-social-protective-context": {
    maturity: "framework",
    label: "Đã khóa khung",
    note: "Đã có record contract và nguyên tắc thu thập tối thiểu; chưa phát hành UI check-in yếu tố bảo vệ.",
    evidence: ["health-record-contracts.ts", "health-domain-catalog.ts", "health-privacy-contracts.ts"],
  },
  "records-appointments-documents": {
    maturity: "partial",
    label: "Đang hoàn thiện",
    note: "Đã có lịch/nhắc, .ics, quyền Google Calendar và vault; quản lý tài liệu/provenance chuyên biệt chưa hoàn chỉnh.",
    evidence: ["reminder-manager.tsx", "secure-vault-center.tsx", "preventive-care-records.tsx"],
  },
  "transition-adult-care": {
    maturity: "partial",
    label: "Đang hoàn thiện",
    note: "Đã có dữ liệu thuốc, hồ sơ, lịch và hướng chuyển tiếp 16–18; health passport/tự quản lý trước đại học chưa thành module hoàn chỉnh.",
    evidence: ["health-framework.tsx", "medications-allergies.tsx", "preventive-care-records.tsx"],
  },
} as const satisfies Record<string, HealthDomainImplementation>;

export function healthDomainMaturitySummary() {
  return Object.values(HEALTH_DOMAIN_IMPLEMENTATION).reduce(
    (summary, item) => ({ ...summary, [item.maturity]: summary[item.maturity] + 1 }),
    { operational: 0, partial: 0, framework: 0 } as Record<HealthDomainMaturity, number>,
  );
}
