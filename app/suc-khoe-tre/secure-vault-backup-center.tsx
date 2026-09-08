"use client";

import { useState } from "react";
import {
  VAULT_BACKUP_MAX_BYTES,
  VAULT_MIN_PIN_LENGTH,
  exportVaultBackup,
  parseVaultBackup,
  type VaultEncryptedBackupV1,
} from "./health-secure-vault";
import { useSecureVaultSession } from "./secure-vault-session";

function safeFileDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function SecureVaultBackupCenter() {
  const { profileId, status, key, recordCount, restoreFromBackup } = useSecureVaultSession();
  const [backup, setBackup] = useState<VaultEncryptedBackupV1 | null>(null);
  const [backupName, setBackupName] = useState("");
  const [pin, setPin] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function downloadBackup() {
    if (status !== "unlocked" || !key) {
      setNotice("Cần mở Secure Vault trước khi xuất bản sao mã hóa.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const envelope = await exportVaultBackup(key, profileId);
      const blob = new Blob([JSON.stringify(envelope)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `suc-khoe-y-te-secure-vault-${safeFileDate()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice(`Đã tạo bản sao mã hóa gồm ${recordCount ?? envelope.recordCount} bản ghi. Hãy lưu tệp ở nơi an toàn.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xuất bản sao Secure Vault.");
    } finally {
      setBusy(false);
    }
  }

  async function chooseBackup(file: File | null) {
    setBackup(null);
    setBackupName("");
    setNotice("");
    if (!file) return;
    if (file.size > VAULT_BACKUP_MAX_BYTES) {
      setNotice("Tệp Secure Vault vượt giới hạn 10 MB của phiên bản hiện tại.");
      return;
    }
    try {
      const parsed = parseVaultBackup(await file.text());
      setBackup(parsed);
      setBackupName(file.name.slice(0, 120));
      setNotice(`Bản sao hợp lệ: ${parsed.recordCount} bản ghi mã hóa. Dữ liệu bên trong chưa được giải mã.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Tệp Secure Vault không hợp lệ.");
    }
  }

  async function restore() {
    if (!backup) {
      setNotice("Chưa chọn bản sao Secure Vault hợp lệ.");
      return;
    }
    if (status !== "not-configured") {
      setNotice("V1 chỉ khôi phục vào hồ sơ chưa có Secure Vault để tránh ghi đè dữ liệu hiện hữu.");
      return;
    }
    if (pin.length < VAULT_MIN_PIN_LENGTH) {
      setNotice(`Mã khóa cần ít nhất ${VAULT_MIN_PIN_LENGTH} ký tự.`);
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const imported = await restoreFromBackup(backup, pin);
      setPin("");
      setBackup(null);
      setBackupName("");
      setNotice(`Đã khôi phục ${imported} bản ghi vào Secure Vault của hồ sơ hiện tại và mở Vault trong bộ nhớ phiên.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể khôi phục Secure Vault.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="vault-backup" aria-label="Sao lưu và khôi phục Secure Vault">
    <header className="vault-backup-head">
      <div>
        <span className="hf-kicker">Encrypted Backup & Recovery V1</span>
        <h3>Sao lưu Vault mà không tạo bản plaintext</h3>
        <p>Bản sao là một gói AES-GCM duy nhất. Nội dung bản ghi, tiêu đề và thời điểm từng bản ghi không xuất hiện dạng rõ trong tệp.</p>
      </div>
      <span className="vault-backup-badge">Local only</span>
    </header>

    <div className="vault-backup-grid">
      <article>
        <span className="vault-backup-step">1 · Xuất</span>
        <h4>Tạo bản sao mã hóa</h4>
        <p>Chỉ xuất khi Vault đang mở. Tệp không được tải lên Site Quản trị hay API nào.</p>
        <button type="button" className="hf-primary vault-backup-action" disabled={busy || status !== "unlocked" || !key} onClick={() => void downloadBackup()}>
          Xuất Secure Vault
        </button>
        <small>{status === "unlocked" ? `${recordCount ?? "—"} bản ghi hiện có` : "Mở Vault để bật xuất bản sao"}</small>
      </article>

      <article>
        <span className="vault-backup-step">2 · Khôi phục</span>
        <h4>Khôi phục vào hồ sơ chưa có Vault</h4>
        <p>V1 không merge hoặc ghi đè Vault đã tồn tại. Bản sao có thể được chuyển sang profileId mới vì dữ liệu được giải mã trong memory rồi mã hóa lại cho hồ sơ đích.</p>
        <label className="vault-backup-file">
          <span>{backupName || "Chọn tệp JSON mã hóa"}</span>
          <input type="file" accept="application/json,.json" disabled={busy || status !== "not-configured"} onChange={(event) => void chooseBackup(event.target.files?.[0] ?? null)} />
        </label>
        <label className="vault-backup-pin">
          <span>Mã khóa của bản sao</span>
          <input type="password" autoComplete="current-password" minLength={VAULT_MIN_PIN_LENGTH} maxLength={128} value={pin} disabled={busy || status !== "not-configured"} onChange={(event) => setPin(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void restore(); }} />
        </label>
        <button type="button" className="hf-secondary vault-backup-action" disabled={busy || status !== "not-configured" || !backup || pin.length < VAULT_MIN_PIN_LENGTH} onClick={() => void restore()}>
          Khôi phục bản sao
        </button>
      </article>
    </div>

    {notice ? <div className="vault-backup-notice" role="status" aria-live="polite">{notice}</div> : null}

    <div className="vault-backup-safety">
      <article><strong>Không phải cơ chế quên PIN</strong><span>Nếu quên mã khóa của bản sao, V1 không có cửa hậu và không thể giải mã thay người dùng.</span></article>
      <article><strong>PIN mạnh vẫn quan trọng</strong><span>Tệp mã hóa có thể bị thử mật khẩu ngoại tuyến nếu bị sao chép; nên dùng cụm mã dài, khó đoán.</span></article>
      <article><strong>Không lộ metadata bản ghi</strong><span>Gói ngoài chỉ chứa phiên bản, profile nguồn, thời điểm xuất, KDF và ciphertext; danh sách bản ghi nằm trong ciphertext.</span></article>
      <article><strong>Không gửi Admin</strong><span>Export/import diễn ra hoàn toàn trong trình duyệt và không dùng Control Plane.</span></article>
    </div>
  </section>;
}
