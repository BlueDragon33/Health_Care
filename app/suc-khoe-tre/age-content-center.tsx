"use client";

import { useEffect, useMemo, useState } from "react";
import EarlyChildhoodGuide from "./early-childhood-guide";
import StageHealthGuide from "./stage-health-guide";
import { HEALTH_LIFE_STAGES, type HealthLifeStageId } from "./health-age-scope";
import { loadHealthProfileRegistry } from "./health-profile-registry";
import { todayKey } from "./health-local-store";
import { completedAgeMonths } from "./who-bmi-reference";

type Sex = "male" | "female" | "";

export default function AgeContentCenter({ ageMonths: suppliedAgeMonths, sex: suppliedSex }: { ageMonths?: number | null; sex?: Sex }) {
  const [detectedAgeMonths, setDetectedAgeMonths] = useState<number | null>(null);
  const [detectedSex, setDetectedSex] = useState<Sex>("");
  const [selectedOverride, setSelectedOverride] = useState<HealthLifeStageId | null>(null);

  useEffect(() => {
    if (suppliedAgeMonths !== undefined || suppliedSex !== undefined) return;
    const timer = window.setTimeout(() => {
      const registry = loadHealthProfileRegistry();
      const activeId = registry.activeProfileId ?? registry.profiles[0]?.id;
      const identity = registry.profiles.find((item) => item.id === activeId);
      setDetectedAgeMonths(identity?.birthDate ? completedAgeMonths(identity.birthDate, todayKey()) : null);
      setDetectedSex(identity?.sexForGrowthReference ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [suppliedAgeMonths, suppliedSex]);

  const profileAgeMonths = suppliedAgeMonths !== undefined ? suppliedAgeMonths : detectedAgeMonths;
  const profileSex = suppliedSex !== undefined ? suppliedSex : detectedSex;
  const current = useMemo(() => HEALTH_LIFE_STAGES.find((stage) => profileAgeMonths !== null && profileAgeMonths >= stage.minMonths && profileAgeMonths <= stage.maxMonths) ?? null, [profileAgeMonths]);
  const selectedId = selectedOverride ?? current?.id ?? "infant-9-11m";
  const selected = HEALTH_LIFE_STAGES.find((stage) => stage.id === selectedId) ?? HEALTH_LIFE_STAGES[0];
  const isEarlyChildhood = selected.maxMonths <= 71;

  return <section className="ac-center" aria-label="Trung tâm nội dung theo tuổi từ 9 tháng đến 18 tuổi">
    <header className="ac-center-head">
      <div><span className="hf-kicker">Age Content Center</span><h3>9 tháng → 18 tuổi · một lộ trình liên tục</h3><p>Nút đang chọn luôn giữ trạng thái active/lõm. Việc chọn giai đoạn ở đây chỉ để xem nội dung; không thay đổi ngày sinh hay hồ sơ sức khỏe.</p></div>
      <span className="ac-current-pill">{current ? `Hồ sơ: ${current.shortLabel}` : "Chưa xác định tuổi hồ sơ"}</span>
    </header>

    <div className="ac-stage-tabs" role="tablist" aria-label="Chọn giai đoạn tuổi để xem nội dung">
      {HEALTH_LIFE_STAGES.map((stage) => <button key={stage.id} type="button" role="tab" aria-selected={selectedId === stage.id} className={selectedId === stage.id ? "is-active" : ""} onClick={() => setSelectedOverride(stage.id)}><span>{stage.shortLabel}</span>{current?.id === stage.id ? <small>Tuổi hồ sơ</small> : null}</button>)}
    </div>

    <article className="ac-stage-summary">
      <div><span className="hf-kicker">Giai đoạn đang xem</span><h4>{selected.label}</h4></div>
      <div className="ac-focus-grid">{selected.focus.map((item) => <span key={item}>{item}</span>)}</div>
    </article>

    {isEarlyChildhood
      ? <EarlyChildhoodGuide ageMonths={selected.id === current?.id ? profileAgeMonths : selected.minMonths} sex={profileSex} />
      : <StageHealthGuide key={selected.id} stageId={selected.id} />}
  </section>;
}
