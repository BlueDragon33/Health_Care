import {
  createInitialHealthState,
  loadHealthState,
  normalizeHealthState,
  uid,
  type HealthLocalState,
  type HealthProfile,
} from "./health-local-store";
import type { HealthProfileIdentity, HealthProfileRegistry, ProfileMigrationEnvelope } from "./health-profile-contracts";

export const PROFILE_REGISTRY_KEY = "suc-khoe-y-te:profiles:v1";
export const PROFILE_STATE_PREFIX = "suc-khoe-y-te:profile-state:v1:";
export const PROFILE_MIGRATION_KEY = "suc-khoe-y-te:profiles:migration:v1";
export const PROFILE_REGISTRY_CHANGED_EVENT = "suc-khoe-y-te:profile-registry-changed";
const MAX_PROFILES = 12;

function profileStateKey(profileId: string) {
  return `${PROFILE_STATE_PREFIX}${profileId}`;
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeIdentity(value: unknown): HealthProfileIdentity | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<HealthProfileIdentity>;
  const id = cleanText(source.id, 120);
  if (!id) return null;
  const now = new Date().toISOString();
  return {
    id,
    displayName: cleanText(source.displayName, 80) || "Hồ sơ chưa đặt tên",
    birthDate: validDate(source.birthDate),
    sexForGrowthReference: source.sexForGrowthReference === "male" || source.sexForGrowthReference === "female" ? source.sexForGrowthReference : "",
    avatarLocalReference: cleanText(source.avatarLocalReference, 240) || undefined,
    createdAt: cleanText(source.createdAt, 50) || now,
    updatedAt: cleanText(source.updatedAt, 50) || now,
  };
}

function normalizeRegistry(value: unknown): HealthProfileRegistry | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<HealthProfileRegistry>;
  const profiles = Array.isArray(source.profiles)
    ? source.profiles.map(normalizeIdentity).filter((item): item is HealthProfileIdentity => item !== null).slice(0, MAX_PROFILES)
    : [];
  if (!profiles.length) return null;
  const requestedActive = cleanText(source.activeProfileId, 120);
  const activeProfileId = profiles.some((profile) => profile.id === requestedActive) ? requestedActive : profiles[0].id;
  return {
    schemaVersion: 1,
    profiles,
    activeProfileId,
    updatedAt: cleanText(source.updatedAt, 50) || new Date().toISOString(),
  };
}

function writeJson(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* localStorage may be blocked */ }
}

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function announceRegistryChange(registry: HealthProfileRegistry) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_REGISTRY_CHANGED_EVENT, {
    detail: { activeProfileId: registry.activeProfileId ?? "", profileCount: registry.profiles.length },
  }));
}

function identityFromState(id: string, state: HealthLocalState, now: string): HealthProfileIdentity {
  return {
    id,
    displayName: state.profile.name.trim().slice(0, 80) || "Hồ sơ 1",
    birthDate: state.profile.birthDate,
    sexForGrowthReference: state.profile.sex,
    createdAt: now,
    updatedAt: now,
  };
}

function migrateSingleProfile(): HealthProfileRegistry {
  const legacyState = loadHealthState();
  const now = new Date().toISOString();
  const profileId = uid("profile");
  const identity = identityFromState(profileId, legacyState, now);
  const registry: HealthProfileRegistry = {
    schemaVersion: 1,
    profiles: [identity],
    activeProfileId: profileId,
    updatedAt: now,
  };
  saveHealthProfileState(profileId, legacyState);
  saveHealthProfileRegistry(registry);
  const envelope: ProfileMigrationEnvelope = {
    fromSingleProfileState: true,
    createdProfileId: profileId,
    migratedAt: now,
    legacyStorageKeyPreserved: true,
  };
  writeJson(PROFILE_MIGRATION_KEY, envelope);
  return registry;
}

export function loadHealthProfileRegistry(): HealthProfileRegistry {
  if (typeof window === "undefined") {
    const now = new Date(0).toISOString();
    return { schemaVersion: 1, profiles: [], activeProfileId: undefined, updatedAt: now };
  }
  const existing = normalizeRegistry(readJson(PROFILE_REGISTRY_KEY));
  return existing ?? migrateSingleProfile();
}

export function saveHealthProfileRegistry(registry: HealthProfileRegistry) {
  if (typeof window === "undefined") return;
  const normalized = normalizeRegistry(registry);
  if (!normalized) return;
  const persisted = { ...normalized, updatedAt: new Date().toISOString() };
  writeJson(PROFILE_REGISTRY_KEY, persisted);
  announceRegistryChange(persisted);
}

export function loadHealthProfileState(profileId: string, identity?: HealthProfileIdentity): HealthLocalState {
  if (typeof window === "undefined") return createInitialHealthState();
  const stored = readJson(profileStateKey(profileId));
  if (stored) {
    const normalized = normalizeHealthState(stored);
    if (!identity) return normalized;
    const reconciled = {
      ...normalized,
      profile: {
        ...normalized.profile,
        name: normalized.profile.name.trim() || identity.displayName,
        birthDate: normalized.profile.birthDate || identity.birthDate,
        sex: normalized.profile.sex || identity.sexForGrowthReference,
      },
    };
    if (
      reconciled.profile.name !== normalized.profile.name ||
      reconciled.profile.birthDate !== normalized.profile.birthDate ||
      reconciled.profile.sex !== normalized.profile.sex
    ) writeJson(profileStateKey(profileId), reconciled);
    return reconciled;
  }
  const state = createInitialHealthState();
  if (identity) {
    state.profile = {
      name: identity.displayName,
      birthDate: identity.birthDate,
      sex: identity.sexForGrowthReference,
      note: "",
    };
  }
  return state;
}

export function saveHealthProfileState(profileId: string, state: HealthLocalState) {
  if (typeof window === "undefined" || !profileId) return;
  writeJson(profileStateKey(profileId), normalizeHealthState({ ...state, updatedAt: new Date().toISOString() }));
}

export function syncRegistryIdentity(registry: HealthProfileRegistry, profileId: string, profile: HealthProfile) {
  const current = registry.profiles.find((item) => item.id === profileId);
  if (!current) return registry;
  const displayName = profile.name.trim().slice(0, 80) || current.displayName;
  const birthDate = profile.birthDate;
  const sexForGrowthReference = profile.sex;
  if (current.displayName === displayName && current.birthDate === birthDate && current.sexForGrowthReference === sexForGrowthReference) return registry;
  const now = new Date().toISOString();
  return {
    ...registry,
    profiles: registry.profiles.map((item) => item.id === profileId ? { ...item, displayName, birthDate, sexForGrowthReference, updatedAt: now } : item),
    updatedAt: now,
  };
}

export function setActiveHealthProfile(registry: HealthProfileRegistry, profileId: string) {
  if (!registry.profiles.some((item) => item.id === profileId)) return registry;
  return { ...registry, activeProfileId: profileId, updatedAt: new Date().toISOString() };
}

export function createHealthProfile(registry: HealthProfileRegistry, displayName: string) {
  if (registry.profiles.length >= MAX_PROFILES) return null;
  const now = new Date().toISOString();
  const id = uid("profile");
  const name = displayName.trim().slice(0, 80) || `Hồ sơ ${registry.profiles.length + 1}`;
  const identity: HealthProfileIdentity = {
    id,
    displayName: name,
    birthDate: "",
    sexForGrowthReference: "",
    createdAt: now,
    updatedAt: now,
  };
  const state = createInitialHealthState();
  state.profile.name = name;
  const next: HealthProfileRegistry = {
    ...registry,
    profiles: [...registry.profiles, identity],
    activeProfileId: id,
    updatedAt: now,
  };
  saveHealthProfileState(id, state);
  saveHealthProfileRegistry(next);
  return { registry: next, state, profileId: id };
}

export function deleteHealthProfile(registry: HealthProfileRegistry, profileId: string) {
  if (registry.profiles.length <= 1) return null;
  if (!registry.profiles.some((item) => item.id === profileId)) return null;
  const profiles = registry.profiles.filter((item) => item.id !== profileId);
  const activeProfileId = registry.activeProfileId === profileId ? profiles[0].id : registry.activeProfileId;
  const next: HealthProfileRegistry = { ...registry, profiles, activeProfileId, updatedAt: new Date().toISOString() };
  try { window.localStorage.removeItem(profileStateKey(profileId)); } catch { /* localStorage may be blocked */ }
  saveHealthProfileRegistry(next);
  return next;
}

export function profileStateStorageKey(profileId: string) {
  return profileStateKey(profileId);
}
