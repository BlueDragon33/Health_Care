"use client";

import { useState } from "react";
import type { HealthProfileIdentity, HealthProfileRegistry } from "./health-profile-contracts";
import { completedAgeMonths } from "./who-bmi-reference";
import { todayKey } from "./health-local-store";

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function ageLabel(profile: HealthProfileIdentity) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.birthDate)) return "Chưa nhập ngày sinh";
  const months = completedAgeMonths(profile.birthDate, todayKey());
  if (months === null || months < 0) return "Chưa nhập ngày sinh";
  if (months < 24) return `${months} tháng`;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return remainder ? `${years} tuổi ${remainder} tháng` : `${years} tuổi`;
}

export default function ProfileSwitcher({
  registry,
  onSwitch,
  onCreate,
  onDelete,
}: {
  registry: HealthProfileRegistry;
  onSwitch: (profileId: string) => void;
  onCreate: (displayName: string) => void;
  onDelete: (profileId: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");

  function submitCreate() {
    onCreate(name);
    setName("");
    setShowCreate(false);
  }

  function confirmDelete(profileId: string, displayName: string) {
    if (registry.profiles.length <= 1) return;
    const accepted = window.confirm(`Xóa hồ sơ “${displayName}” trên thiết bị này? Dữ liệu local của hồ sơ này sẽ bị xóa. Hành động không ảnh hưởng hồ sơ khác.`);
    if (accepted) onDelete(profileId);
  }

  return <section className="profile-switcher" aria-label="Chọn hồ sơ sức khỏe">
    <div className="profile-switcher-head">
      <div><span className="hf-kicker">Hồ sơ đang theo dõi</span><strong>{registry.profiles.length} hồ sơ trên thiết bị</strong></div>
      <button type="button" className="profile-add-toggle" aria-expanded={showCreate} onClick={() => setShowCreate((value) => !value)}>{showCreate ? "Đóng" : "+ Thêm hồ sơ"}</button>
    </div>

    <div className="profile-switcher-list" role="list">
      {registry.profiles.map((profile) => {
        const selected = profile.id === registry.activeProfileId;
        return <article key={profile.id} className={selected ? "is-selected" : ""} role="listitem">
          <button type="button" className="profile-select" aria-pressed={selected} onClick={() => onSwitch(profile.id)}>
            <span className="profile-avatar" aria-hidden="true">{initials(profile.displayName)}</span>
            <span className="profile-copy">
              <span>{selected ? "Đang theo dõi" : ageLabel(profile)}</span>
              <strong>{profile.displayName}</strong>
              <small>{selected ? ageLabel(profile) : "Chạm để chuyển hồ sơ"}</small>
            </span>
          </button>
          {registry.profiles.length > 1 ? <button type="button" className="profile-delete" aria-label={`Xóa hồ sơ ${profile.displayName}`} onClick={() => confirmDelete(profile.id, profile.displayName)}>Xóa</button> : null}
        </article>;
      })}
    </div>

    {showCreate ? <div className="profile-create-form">
      <label>Tên / tên gọi<input autoFocus value={name} maxLength={80} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitCreate(); }} placeholder={`Ví dụ: Con ${registry.profiles.length + 1}`} /></label>
      <button type="button" className="hf-primary" onClick={submitCreate}>Tạo hồ sơ riêng</button>
    </div> : null}

    <p className="profile-switcher-boundary">Mỗi hồ sơ dùng storage key riêng. Chuyển hồ sơ không gộp timeline, reminder, tăng trưởng hoặc nhật ký giữa các con.</p>
  </section>;
}
