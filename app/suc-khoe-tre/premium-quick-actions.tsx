"use client";

export type PremiumQuickTarget = "nutrition" | "activity" | "care" | "journal" | "growth" | "profile";

type QuickAction = {
  id: PremiumQuickTarget;
  icon: string;
  title: string;
  subtitle: string;
  tone: "rose" | "mint" | "violet" | "amber" | "blue" | "coral";
};

const actions: QuickAction[] = [
  { id: "nutrition", icon: "●", title: "Ghi bữa ăn", subtitle: "Dinh dưỡng", tone: "rose" },
  { id: "activity", icon: "↗", title: "Ghi vận động", subtitle: "Hoạt động", tone: "mint" },
  { id: "care", icon: "☾", title: "Ghi giấc ngủ", subtitle: "Chăm sóc", tone: "violet" },
  { id: "journal", icon: "+", title: "Ghi triệu chứng", subtitle: "Nhật ký", tone: "amber" },
  { id: "growth", icon: "⌁", title: "Ghi chiều cao / cân nặng", subtitle: "Tăng trưởng", tone: "blue" },
  { id: "profile", icon: "•", title: "Thêm nhắc nhở", subtitle: "Hồ sơ", tone: "coral" },
];

export default function PremiumQuickActions({ onNavigate }: { onNavigate: (target: PremiumQuickTarget) => void }) {
  return <section className="premium-quick-actions" aria-label="Thao tác nhanh">
    {actions.map((action) => <button
      key={action.id}
      type="button"
      className={`premium-quick-action tone-${action.tone}`}
      onClick={() => onNavigate(action.id)}
    >
      <span className="premium-quick-icon" aria-hidden="true">{action.icon}</span>
      <span className="premium-quick-copy"><strong>{action.title}</strong><small>{action.subtitle}</small></span>
    </button>)}
  </section>;
}
