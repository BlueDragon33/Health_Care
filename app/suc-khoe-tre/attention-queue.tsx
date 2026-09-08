"use client";

import { useMemo } from "react";
import type { HealthLocalState } from "./health-local-store";
import { buildOperationalAttentionSnapshot, operationalCompleteness } from "./health-attention-engine";

export type AttentionNavigationTarget = "profile" | "growth";

function targetFor(domainId: string): AttentionNavigationTarget {
  return domainId === "growth-development" ? "growth" : "profile";
}

function priorityLabel(priority: "info" | "due" | "review" | "urgent") {
  if (priority === "due") return "Đến hạn";
  if (priority === "review") return "Cần xem";
  if (priority === "urgent") return "Khẩn";
  return "Bổ sung dữ liệu";
}

export default function AttentionQueue({
  state,
  onNavigate,
}: {
  state: HealthLocalState;
  onNavigate: (target: AttentionNavigationTarget) => void;
}) {
  const snapshot = useMemo(() => buildOperationalAttentionSnapshot(state), [state]);
  const completeness = useMemo(() => operationalCompleteness(state), [state]);
  const dueCount = snapshot.due.length;
  const gapCount = snapshot.dataGaps.length;

  return <section className="attention-queue" aria-label="Việc cần chú ý từ dữ liệu đã ghi">
    <header className="attention-head">
      <div>
        <span className="hf-kicker">Theo dõi không bỏ sót</span>
        <h3>Việc cần chú ý</h3>
        <p>Chỉ gom lịch người dùng sắp đến hạn và dữ liệu nền còn thiếu. Chưa kích hoạt cảnh báo y khoa tự động.</p>
      </div>
      <div className="attention-counts" aria-label="Tóm tắt việc cần chú ý">
        <span><strong>{dueCount}</strong> đến hạn 24 giờ</span>
        <span><strong>{gapCount}</strong> dữ liệu còn thiếu</span>
      </div>
    </header>

    <div className="attention-completeness">
      <div className="attention-completeness-head">
        <div><span>Mức hoàn thiện dữ liệu nền</span><strong>{completeness.completed}/{completeness.total}</strong></div>
        <small>Đây không phải điểm sức khỏe.</small>
      </div>
      <div className="attention-progress" aria-hidden="true"><span style={{ width: `${(completeness.completed / completeness.total) * 100}%` }} /></div>
      <div className="attention-checks">
        {completeness.checks.map((item) => <button key={item.id} type="button" className={item.complete ? "is-complete" : ""} onClick={() => onNavigate(item.target)}><span>{item.complete ? "✓" : "○"}</span><strong>{item.label}</strong></button>)}
      </div>
    </div>

    {snapshot.attention.length ? <div className="attention-list">
      {snapshot.attention.map((item) => <article key={item.id} className={`priority-${item.priority}`}>
        <div>
          <span>{priorityLabel(item.priority)}</span>
          <strong>{item.title}</strong>
          {item.summary ? <small>{item.summary}</small> : null}
        </div>
        <button type="button" onClick={() => onNavigate(targetFor(item.domainId))}>{item.source === "user-reminder" ? "Mở lịch" : "Bổ sung"}</button>
      </article>)}
    </div> : <div className="attention-empty"><strong>Không có việc vận hành cần chú ý từ dữ liệu hiện có.</strong><span>Ngày trống hoặc ít dữ liệu không được hiểu là sức khỏe xấu.</span></div>}

    <p className="attention-boundary">Attention Queue V1 không tạo “điểm sức khỏe tổng”, không suy ra bệnh từ triệu chứng và không sinh cảnh báo khẩn. Các rule lâm sàng sau này chỉ được bật khi có nguồn, phiên bản và test riêng.</p>
  </section>;
}
