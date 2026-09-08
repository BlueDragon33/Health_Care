"use client";

import { useEffect, useMemo, useState } from "react";
import { HEALTH_DOMAINS } from "./health-domain-catalog";
import {
  HEALTH_VIEWER_ROLE_LABELS,
  HEALTH_VISIBILITY_LABELS,
  canViewerAccessDomain,
  createDefaultPrivacyPolicy,
  loadProfilePrivacyPolicy,
  loadViewerRole,
  privacyPolicySummary,
  saveProfilePrivacyPolicy,
  saveViewerRole,
  setDomainVisibility,
  type HealthProfilePrivacyPolicy,
  type HealthViewerRole,
  type HealthVisibility,
} from "./health-profile-privacy";

const visibilityChoices: HealthVisibility[] = ["shared", "caregiver-only", "youth-private"];
const roles: HealthViewerRole[] = ["caregiver", "self", "trusted-helper"];

export default function PrivacyCenter({ profileId }: { profileId: string }) {
  const [policy, setPolicy] = useState<HealthProfilePrivacyPolicy>(() => createDefaultPrivacyPolicy(profileId));
  const [role, setRole] = useState<HealthViewerRole>("caregiver");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPolicy(loadProfilePrivacyPolicy(profileId));
      setRole(loadViewerRole());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profileId]);

  const sensitiveDomains = useMemo(() => HEALTH_DOMAINS.filter((domain) => domain.privacy === "highly-sensitive"), []);
  const summary = useMemo(() => privacyPolicySummary(policy), [policy]);

  function changeRole(next: HealthViewerRole) {
    setRole(next);
    saveViewerRole(next);
  }

  function changeVisibility(domainId: string, visibility: HealthVisibility) {
    const next = setDomainVisibility(policy, domainId, visibility);
    setPolicy(next);
    saveProfilePrivacyPolicy(next);
  }

  return <section className="privacy-center" aria-label="Quyền riêng tư hồ sơ">
    <header className="privacy-head">
      <div>
        <span className="hf-kicker">Profile Privacy V1</span>
        <h3>Ai đang xem hồ sơ này?</h3>
        <p>Quyền vào thiết bị do Trung tâm Quản trị cấp không đồng nghĩa được xem mọi dữ liệu của hồ sơ.</p>
      </div>
      <div className="privacy-summary" aria-label="Mức cấu hình dữ liệu rất nhạy cảm">
        <strong>{summary.configured}/{summary.total}</strong>
        <span>miền rất nhạy cảm đã cấu hình</span>
      </div>
    </header>

    <div className="privacy-role-grid" role="group" aria-label="Chế độ người đang xem">
      {roles.map((item) => <button
        type="button"
        key={item}
        className={role === item ? "is-selected" : ""}
        aria-pressed={role === item}
        onClick={() => changeRole(item)}
      >
        <strong>{HEALTH_VIEWER_ROLE_LABELS[item]}</strong>
        <small>{item === "caregiver" ? "Quản lý/chăm sóc hồ sơ" : item === "self" ? "Người được theo dõi tự xem" : "Chỉ xem phần được chia sẻ"}</small>
      </button>)}
    </div>

    <div className="privacy-boundary-note">
      <strong>Ranh giới V1:</strong> vai trò vẫn là chế độ xem trong phiên, chưa phải xác thực danh tính. Secure Health Vault hiện mã hóa payload nhạy cảm và yêu cầu mã khóa để mở dữ liệu, nhưng không tự chứng minh người mở khóa là phụ huynh hay chính người được theo dõi. Không có dữ liệu quyền riêng tư nào được gửi sang Site Quản trị.
    </div>

    <div className="privacy-sensitive-head">
      <div><span className="hf-kicker">Dữ liệu rất nhạy cảm</span><h4>Phải chọn phạm vi trước khi triển khai sâu</h4></div>
      <small>{ready ? `${summary.pending} miền còn chưa cấu hình` : "Đang đọc cấu hình local…"}</small>
    </div>

    <div className="privacy-domain-list">
      {sensitiveDomains.map((domain) => {
        const visibility = policy.domainVisibility[domain.id] ?? "unconfigured";
        const visibleNow = canViewerAccessDomain(policy, domain.id, role);
        return <article key={domain.id} className={visibility === "unconfigured" ? "is-unconfigured" : ""}>
          <div className="privacy-domain-copy">
            <span>{visibility === "unconfigured" ? "Chưa cấu hình · khóa mặc định" : visibleNow ? "Có thể xem trong chế độ hiện tại" : "Ẩn trong chế độ hiện tại"}</span>
            <strong>{domain.title}</strong>
            <small>{domain.guardrail ?? domain.summary}</small>
          </div>
          <label>
            <span>Phạm vi xem</span>
            <select value={visibility} onChange={(event) => changeVisibility(domain.id, event.target.value as HealthVisibility)}>
              <option value="unconfigured">{HEALTH_VISIBILITY_LABELS.unconfigured}</option>
              {visibilityChoices.map((choice) => <option key={choice} value={choice}>{HEALTH_VISIBILITY_LABELS[choice]}</option>)}
            </select>
          </label>
        </article>;
      })}
    </div>

    <p className="privacy-footnote">Không tự thay đổi quyền theo một mốc tuổi pháp lý cố định. Khi triển khai nghiệp vụ nhạy cảm, quy tắc theo quốc gia/bối cảnh phải có phiên bản và review riêng.</p>
  </section>;
}
