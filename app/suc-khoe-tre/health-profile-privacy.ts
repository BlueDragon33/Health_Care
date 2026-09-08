import { HEALTH_DOMAINS, type HealthPrivacyLevel } from "./health-domain-catalog";

export type HealthViewerRole = "self" | "caregiver" | "trusted-helper";
export type HealthVisibility = "shared" | "caregiver-only" | "youth-private" | "emergency-card-only" | "unconfigured";
export type HealthPrivacyContext = "normal" | "emergency";

export type HealthProfilePrivacyPolicy = {
  schemaVersion: 1;
  profileId: string;
  domainVisibility: Record<string, HealthVisibility>;
  updatedAt: string;
};

export const PROFILE_PRIVACY_PREFIX = "suc-khoe-y-te:profile-privacy:v1:";
export const VIEWER_ROLE_SESSION_KEY = "suc-khoe-y-te:viewer-role:v1";

export const HEALTH_VIEWER_ROLE_LABELS: Record<HealthViewerRole, string> = {
  self: "Chính người được theo dõi",
  caregiver: "Phụ huynh / người chăm sóc",
  "trusted-helper": "Người hỗ trợ tin cậy",
};

export const HEALTH_VISIBILITY_LABELS: Record<HealthVisibility, string> = {
  shared: "Chia sẻ trong hồ sơ",
  "caregiver-only": "Chỉ người chăm sóc",
  "youth-private": "Riêng tư với người được theo dõi",
  "emergency-card-only": "Chỉ thẻ khẩn cấp",
  unconfigured: "Chưa cấu hình",
};

function defaultVisibility(privacy: HealthPrivacyLevel): HealthVisibility {
  if (privacy === "highly-sensitive") return "unconfigured";
  return "shared";
}

export function createDefaultPrivacyPolicy(profileId: string): HealthProfilePrivacyPolicy {
  return {
    schemaVersion: 1,
    profileId,
    domainVisibility: Object.fromEntries(HEALTH_DOMAINS.map((domain) => [domain.id, defaultVisibility(domain.privacy)])),
    updatedAt: new Date(0).toISOString(),
  };
}

function normalizeVisibility(value: unknown): HealthVisibility | null {
  return ["shared", "caregiver-only", "youth-private", "emergency-card-only", "unconfigured"].includes(String(value))
    ? value as HealthVisibility
    : null;
}

export function normalizePrivacyPolicy(value: unknown, profileId: string): HealthProfilePrivacyPolicy {
  const fallback = createDefaultPrivacyPolicy(profileId);
  if (!value || typeof value !== "object") return fallback;
  const source = value as Partial<HealthProfilePrivacyPolicy>;
  const raw = source.domainVisibility && typeof source.domainVisibility === "object" ? source.domainVisibility : {};
  const domainVisibility = { ...fallback.domainVisibility };
  for (const domain of HEALTH_DOMAINS) {
    const normalized = normalizeVisibility((raw as Record<string, unknown>)[domain.id]);
    if (normalized) domainVisibility[domain.id] = normalized;
  }
  return {
    schemaVersion: 1,
    profileId,
    domainVisibility,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt.slice(0, 50) : fallback.updatedAt,
  };
}

export function loadProfilePrivacyPolicy(profileId: string) {
  if (typeof window === "undefined" || !profileId) return createDefaultPrivacyPolicy(profileId);
  try {
    const raw = window.localStorage.getItem(`${PROFILE_PRIVACY_PREFIX}${profileId}`);
    return raw ? normalizePrivacyPolicy(JSON.parse(raw), profileId) : createDefaultPrivacyPolicy(profileId);
  } catch {
    return createDefaultPrivacyPolicy(profileId);
  }
}

export function saveProfilePrivacyPolicy(policy: HealthProfilePrivacyPolicy) {
  if (typeof window === "undefined" || !policy.profileId) return;
  const normalized = normalizePrivacyPolicy({ ...policy, updatedAt: new Date().toISOString() }, policy.profileId);
  try { window.localStorage.setItem(`${PROFILE_PRIVACY_PREFIX}${policy.profileId}`, JSON.stringify(normalized)); } catch { /* storage may be blocked */ }
}

export function loadViewerRole(): HealthViewerRole {
  if (typeof window === "undefined") return "caregiver";
  try {
    const value = window.sessionStorage.getItem(VIEWER_ROLE_SESSION_KEY);
    return value === "self" || value === "trusted-helper" || value === "caregiver" ? value : "caregiver";
  } catch {
    return "caregiver";
  }
}

export function saveViewerRole(role: HealthViewerRole) {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(VIEWER_ROLE_SESSION_KEY, role); } catch { /* sessionStorage may be blocked */ }
}

export function canViewerAccessVisibility(visibility: HealthVisibility, role: HealthViewerRole, context: HealthPrivacyContext = "normal") {
  if (visibility === "unconfigured") return false;
  if (visibility === "shared") return true;
  if (visibility === "caregiver-only") return role === "caregiver";
  if (visibility === "youth-private") return role === "self";
  return context === "emergency";
}

export function canViewerAccessDomain(policy: HealthProfilePrivacyPolicy, domainId: string, role: HealthViewerRole, context: HealthPrivacyContext = "normal") {
  const visibility = policy.domainVisibility[domainId] ?? "unconfigured";
  return canViewerAccessVisibility(visibility, role, context);
}

export function setDomainVisibility(policy: HealthProfilePrivacyPolicy, domainId: string, visibility: HealthVisibility): HealthProfilePrivacyPolicy {
  if (!HEALTH_DOMAINS.some((domain) => domain.id === domainId)) return policy;
  return {
    ...policy,
    domainVisibility: { ...policy.domainVisibility, [domainId]: visibility },
    updatedAt: new Date().toISOString(),
  };
}

export function privacyPolicySummary(policy: HealthProfilePrivacyPolicy) {
  const highlySensitive = HEALTH_DOMAINS.filter((domain) => domain.privacy === "highly-sensitive");
  const configured = highlySensitive.filter((domain) => policy.domainVisibility[domain.id] !== "unconfigured").length;
  return { configured, total: highlySensitive.length, pending: highlySensitive.length - configured };
}

export const PROFILE_PRIVACY_V1_GUARDRAILS = {
  deviceApprovalIsNotProfileAuthorization: true,
  highlySensitiveRequiresExplicitVisibility: true,
  noJurisdictionAgeCutoffHardcoded: true,
  adminReceivesNoProfilePrivacyPolicy: true,
  viewerRoleV1IsNotCryptographicAuthentication: true,
  secureVaultRequiredBeforeStrongLocalRoleLock: true,
} as const;
