"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HEALTH_VISIBILITY_LABELS,
  PROFILE_PRIVACY_CHANGED_EVENT,
  canViewerAccessDomain,
  createDefaultPrivacyPolicy,
  loadProfilePrivacyPolicy,
  loadViewerRole,
  type HealthProfilePrivacyPolicy,
  type HealthViewerRole,
  type HealthVisibility,
} from "./health-profile-privacy";
import { useSecureVaultSession } from "./secure-vault-session";

export function useSensitiveVaultDomain(domainId: string) {
  const vault = useSecureVaultSession();
  const { profileId } = vault;
  const [policy, setPolicy] = useState<HealthProfilePrivacyPolicy>(() => createDefaultPrivacyPolicy(profileId));
  const [role, setRole] = useState<HealthViewerRole>("caregiver");
  const [privacyReady, setPrivacyReady] = useState(false);

  const refreshPrivacy = useCallback(() => {
    setPolicy(loadProfilePrivacyPolicy(profileId));
    setRole(loadViewerRole());
    setPrivacyReady(true);
  }, [profileId]);

  useEffect(() => {
    const timer = window.setTimeout(refreshPrivacy, 0);
    const changed = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: string; profileId?: string }>).detail;
      if (detail?.kind === "policy" && detail.profileId && detail.profileId !== profileId) return;
      refreshPrivacy();
    };
    window.addEventListener(PROFILE_PRIVACY_CHANGED_EVENT, changed);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(PROFILE_PRIVACY_CHANGED_EVENT, changed);
    };
  }, [profileId, refreshPrivacy]);

  const visibility = (policy.domainVisibility[domainId] ?? "unconfigured") as HealthVisibility;
  const privacyAllowed = useMemo(
    () => canViewerAccessDomain(policy, domainId, role),
    [domainId, policy, role],
  );
  const canDecrypt = privacyReady && privacyAllowed && vault.status === "unlocked" && Boolean(vault.key);

  return {
    ...vault,
    policy,
    role,
    privacyReady,
    visibility,
    visibilityLabel: HEALTH_VISIBILITY_LABELS[visibility],
    privacyAllowed,
    canDecrypt,
    refreshPrivacy,
  };
}

export const SENSITIVE_VAULT_DOMAIN_ACCESS_V1_GUARDRAILS = {
  deviceApprovalDoesNotGrantSensitiveDomainAccess: true,
  requiresExplicitProfilePrivacyPolicy: true,
  respectsCurrentViewerRole: true,
  requiresActiveProfileUnlockedVault: true,
  sameTabPrivacyChangesPropagate: true,
  noAdminOrNetworkDependency: true,
} as const;
