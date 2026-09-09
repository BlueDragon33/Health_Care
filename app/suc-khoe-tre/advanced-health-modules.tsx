"use client";

import { useEffect, useState } from "react";
import type { HealthProfileRegistry } from "./health-profile-contracts";
import {
  HEALTH_PROFILE_REGISTRY_CHANGED_EVENT,
  PROFILE_REGISTRY_KEY,
  loadHealthProfileRegistry,
} from "./health-profile-registry";
import { SecureVaultSessionProvider } from "./secure-vault-session";
import SecureVaultCenter from "./secure-vault-center";
import InjurySportsMusculoskeletal from "./injury-sports-musculoskeletal";
import styles from "./advanced-health-modules.module.css";

function currentRegistry() {
  try { return loadHealthProfileRegistry(); }
  catch { return null; }
}

export default function AdvancedHealthModules() {
  const [registry, setRegistry] = useState<HealthProfileRegistry | null>(null);

  useEffect(() => {
    const refresh = () => setRegistry(currentRegistry());
    const storage = (event: StorageEvent) => {
      if (!event.key || event.key === PROFILE_REGISTRY_KEY) refresh();
    };
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(HEALTH_PROFILE_REGISTRY_CHANGED_EVENT, refresh);
    window.addEventListener("storage", storage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(HEALTH_PROFILE_REGISTRY_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", storage);
    };
  }, []);

  const activeProfileId = registry?.activeProfileId ?? "";
  const activeProfile = registry?.profiles.find((profile) => profile.id === activeProfileId) ?? null;

  return <details className={styles.shell}>
    <summary>
      <div>
        <span>MODULE CHUYÊN SÂU · LOCAL-FIRST</span>
        <strong>Chấn thương, thể thao & cơ xương khớp</strong>
        <small>Module mới được tách khỏi core dashboard; dữ liệu nhạy cảm nằm trong Secure Vault của đúng hồ sơ.</small>
      </div>
      <b>Mở module</b>
    </summary>
    <div className={styles.body}>
      {!activeProfileId ? <div className={styles.empty}>Chưa xác định được hồ sơ đang hoạt động. Hãy tạo/chọn hồ sơ trong Web App trước.</div> : <>
        <div className={styles.profileBar}>
          <div><span>HỒ SƠ ĐANG DÙNG</span><strong>{activeProfile?.displayName ?? "Hồ sơ hiện tại"}</strong></div>
          <small>Khi đổi hồ sơ trong Web App, module này tự chuyển context và bỏ khóa giải mã của hồ sơ trước.</small>
        </div>
        <SecureVaultSessionProvider key={`advanced-vault-${activeProfileId}`} profileId={activeProfileId}>
          <SecureVaultCenter />
          <InjurySportsMusculoskeletal />
        </SecureVaultSessionProvider>
      </>}
    </div>
  </details>;
}
