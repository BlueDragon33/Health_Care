"use client";

import type { HealthLifeStage } from "./health-age-scope";

export type PremiumQuickTarget = "nutrition" | "activity" | "care" | "journal" | "growth" | "profile";

type QuickAction = {
  id: PremiumQuickTarget;
  title: string;
  subtitle: string;
  tone: "rose" | "mint" | "violet" | "amber" | "blue" | "coral";
};

function quickActionsForLifeStage(stage: HealthLifeStage | null): QuickAction[] {
  const infant = stage?.id === "infant-9-11m" || stage?.id === "toddler-12-23m";
  const earlyChildhood = stage?.id === "early-childhood-2-5y";

  return [
    {
      id: "nutrition",
      title: infant ? "Ghi bú / ăn" : "Ghi bữa ăn",
      subtitle: infant ? "Dinh dưỡng trẻ nhỏ" : "Dinh dưỡng",
      tone: "rose",
    },
    {
      id: "activity",
      title: infant || earlyChildhood ? "Ghi chơi / vận động" : "Ghi vận động",
      subtitle: infant || earlyChildhood ? "Vận động theo tuổi" : "Hoạt động",
      tone: "mint",
    },
    { id: "care", title: "Ghi giấc ngủ", subtitle: "Chăm sóc", tone: "violet" },
    {
      id: "journal",
      title: infant ? "Ghi dấu hiệu" : "Ghi triệu chứng",
      subtitle: infant ? "Người chăm sóc ghi" : "Nhật ký",
      tone: "amber",
    },
    {
      id: "growth",
      title: infant ? "Ghi chiều dài / cân nặng" : "Ghi chiều cao / cân nặng",
      subtitle: "Tăng trưởng",
      tone: "blue",
    },
    {
      id: "profile",
      title: infant ? "Thêm nhắc chăm sóc" : "Thêm nhắc nhở",
      subtitle: "Hồ sơ",
      tone: "coral",
    },
  ];
}

const svgProps = {
  viewBox: "0 0 24 24",
  role: "presentation" as const,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function QuickIcon({ id }: { id: PremiumQuickTarget }) {
  if (id === "nutrition") return <svg {...svgProps}><path d="M12.1 7.2c-1.7-2-5.6-1.6-7 1.2-1.9 3.7.5 9.9 3.7 11.2 1.2.5 2.1-.2 3.3-.2s2.1.7 3.3.2c3.2-1.3 5.6-7.5 3.7-11.2-1.4-2.8-5.3-3.2-7-1.2Z"/><path d="M12.2 6.9c-.1-2.2 1.4-4 3.5-4.5.1 2.1-1.4 4-3.5 4.5Z"/></svg>;
  if (id === "activity") return <svg {...svgProps}><circle cx="14.5" cy="4.5" r="2"/><path d="m11 8 3 2 2.5 4.2M11 8 8.5 12 5 13.5M13 11.2l-2 4.3-4 4M14.3 14.7l3 4.3"/></svg>;
  if (id === "care") return <svg {...svgProps}><path d="M19.6 15.2A8.2 8.2 0 0 1 8.8 4.4 8.3 8.3 0 1 0 19.6 15.2Z"/></svg>;
  if (id === "journal") return <svg {...svgProps}><path d="M10 4a2 2 0 0 1 4 0v8.2a4.8 4.8 0 1 1-4 0V4Z"/><path d="M12 8v7"/></svg>;
  if (id === "growth") return <svg {...svgProps}><path d="M4 19V6M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/><path d="M16 6h2v2"/></svg>;
  return <svg {...svgProps}><path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z"/><path d="M9.5 20h5"/></svg>;
}

export default function PremiumQuickActions({ stage, onNavigate }: { stage: HealthLifeStage | null; onNavigate: (target: PremiumQuickTarget) => void }) {
  const actions = quickActionsForLifeStage(stage);

  return <section className="premium-quick-actions" aria-label="Thao tác nhanh theo giai đoạn tuổi">
    {actions.map((action) => <button
      key={action.id}
      type="button"
      className={`premium-quick-action tone-${action.tone}`}
      onClick={() => onNavigate(action.id)}
    >
      <span className="premium-quick-icon" aria-hidden="true"><QuickIcon id={action.id} /></span>
      <span className="premium-quick-copy"><strong>{action.title}</strong><small>{action.subtitle}</small></span>
    </button>)}
  </section>;
}

export const PREMIUM_QUICK_ACTION_GUARDRAILS = {
  agePresentationOnly: true,
  noHealthDataTransport: true,
  noDiagnosisOrTreatmentGeneration: true,
} as const;
