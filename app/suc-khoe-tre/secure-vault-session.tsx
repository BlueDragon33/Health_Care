"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  VAULT_AUTO_LOCK_MS,
  countVaultRecords,
  restoreVaultBackup,
  setupVault,
  unlockVault,
  vaultConfigured,
  vaultRuntimeSupported,
  type VaultEncryptedBackupV1,
  type VaultStatus,
} from "./health-secure-vault";

type VaultLockReason = "manual" | "idle" | "pagehide" | "profile-change";

type SecureVaultSessionValue = {
  profileId: string;
  status: VaultStatus;
  key: CryptoKey | null;
  recordCount: number | null;
  lockReason: VaultLockReason | null;
  setup: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  restoreFromBackup: (backup: VaultEncryptedBackupV1, pin: string) => Promise<number>;
  lock: (reason?: VaultLockReason) => void;
  refreshRecordCount: () => Promise<void>;
};

const SecureVaultSessionContext = createContext<SecureVaultSessionValue | null>(null);

export function SecureVaultSessionProvider({ profileId, children }: { profileId: string; children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>("not-configured");
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [lockReason, setLockReason] = useState<VaultLockReason | null>(null);
  const lockTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKey(null);
      setRecordCount(null);
      setLockReason("profile-change");
      setStatus(vaultRuntimeSupported() ? (vaultConfigured(profileId) ? "locked" : "not-configured") : "unsupported");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profileId]);

  const lock = useCallback((reason: VaultLockReason = "manual") => {
    if (lockTimer.current !== null) window.clearTimeout(lockTimer.current);
    lockTimer.current = null;
    setKey(null);
    setRecordCount(null);
    setLockReason(reason);
    setStatus((current) => current === "unsupported" || current === "not-configured" ? current : "locked");
  }, []);

  useEffect(() => {
    if (!key || status !== "unlocked") return;
    const arm = () => {
      if (lockTimer.current !== null) window.clearTimeout(lockTimer.current);
      lockTimer.current = window.setTimeout(() => lock("idle"), VAULT_AUTO_LOCK_MS);
    };
    const activity = () => arm();
    const pagehide = () => lock("pagehide");
    arm();
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("touchstart", activity, { passive: true });
    window.addEventListener("pagehide", pagehide);
    return () => {
      if (lockTimer.current !== null) window.clearTimeout(lockTimer.current);
      lockTimer.current = null;
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("touchstart", activity);
      window.removeEventListener("pagehide", pagehide);
    };
  }, [key, lock, status]);

  const setup = useCallback(async (pin: string) => {
    const nextKey = await setupVault(profileId, pin);
    setKey(nextKey);
    setRecordCount(0);
    setLockReason(null);
    setStatus("unlocked");
  }, [profileId]);

  const unlock = useCallback(async (pin: string) => {
    const nextKey = await unlockVault(profileId, pin);
    const count = await countVaultRecords(nextKey, profileId);
    setKey(nextKey);
    setRecordCount(count);
    setLockReason(null);
    setStatus("unlocked");
  }, [profileId]);

  const restoreFromBackup = useCallback(async (backup: VaultEncryptedBackupV1, pin: string) => {
    const restored = await restoreVaultBackup(profileId, pin, backup);
    setKey(restored.key);
    setRecordCount(restored.importedCount);
    setLockReason(null);
    setStatus("unlocked");
    return restored.importedCount;
  }, [profileId]);

  const refreshRecordCount = useCallback(async () => {
    if (!key || status !== "unlocked") {
      setRecordCount(null);
      return;
    }
    setRecordCount(await countVaultRecords(key, profileId));
  }, [key, profileId, status]);

  const value = useMemo<SecureVaultSessionValue>(() => ({
    profileId,
    status,
    key,
    recordCount,
    lockReason,
    setup,
    unlock,
    restoreFromBackup,
    lock,
    refreshRecordCount,
  }), [key, lock, lockReason, profileId, recordCount, refreshRecordCount, restoreFromBackup, setup, status, unlock]);

  return <SecureVaultSessionContext.Provider value={value}>{children}</SecureVaultSessionContext.Provider>;
}

export function useSecureVaultSession() {
  const context = useContext(SecureVaultSessionContext);
  if (!context) throw new Error("useSecureVaultSession phải nằm trong SecureVaultSessionProvider.");
  return context;
}

export const SECURE_VAULT_SESSION_V1_GUARDRAILS = {
  oneUnlockedKeyPerActiveProfileProvider: true,
  profileSwitchDropsPreviousKeyReference: true,
  pagehideLocksVault: true,
  inactivityLocksVault: true,
  noPersistentSessionKey: true,
} as const;
