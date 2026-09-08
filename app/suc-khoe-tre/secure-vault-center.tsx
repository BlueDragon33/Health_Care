"use client";

import { useEffect, useState } from "react";
import { VAULT_MIN_PIN_LENGTH, type VaultStatus } from "./health-secure-vault";
import { useSecureVaultSession } from "./secure-vault-session";

function statusLabel(status: VaultStatus) {
  if (status === "unlocked") return "Đang mở trong bộ nhớ phiên";
  if (status === "locked") return "Đã khóa";
  if (status === "unsupported") return "Không được hỗ trợ";
  return "Chưa cấu hình";
}

export default function SecureVaultCenter() {
  const { status, recordCount, lockReason, setup, unlock, lock } = useSecureVaultSession();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPin("");
      setConfirmPin("");
      if (lockReason === "idle") setNotice("Secure Vault đã tự khóa sau 10 phút không hoạt động.");
      else if (lockReason === "pagehide") setNotice("Secure Vault đã khóa khi rời trang.");
      else if (lockReason === "profile-change") setNotice("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lockReason]);

  async function configure() {
    setNotice("");
    if (pin.length < VAULT_MIN_PIN_LENGTH) { setNotice(`Mã khóa cần ít nhất ${VAULT_MIN_PIN_LENGTH} ký tự.`); return; }
    if (pin !== confirmPin) { setNotice("Hai lần nhập mã khóa chưa khớp."); return; }
    try {
      await setup(pin);
      setPin("");
      setConfirmPin("");
      setNotice("Secure Vault đã được tạo. Khóa giải mã chỉ đang nằm trong bộ nhớ phiên.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể tạo Secure Vault.");
    }
  }

  async function unlockNow() {
    setNotice("");
    try {
      await unlock(pin);
      setPin("");
      setNotice("Đã mở Secure Vault cho hồ sơ đang chọn.");
    } catch (error) {
      setPin("");
      setNotice(error instanceof Error ? error.message : "Không thể mở Secure Vault.");
    }
  }

  function lockNow() {
    lock("manual");
    setPin("");
    setConfirmPin("");
    setNotice("Đã khóa Secure Vault. Khóa giải mã đã được bỏ khỏi state phiên.");
  }

  return <section className="vault-center" aria-label="Secure Health Vault">
    <header className="vault-head">
      <div>
        <span className="hf-kicker">Secure Health Vault V2 Session</span>
        <h3>Kho mã hóa cho dữ liệu rất nhạy cảm</h3>
        <p>Một phiên Vault dùng chung cho các module riêng tư của đúng hồ sơ đang chọn; đổi hồ sơ sẽ hủy tham chiếu khóa cũ.</p>
      </div>
      <div className={`vault-status status-${status}`} aria-live="polite"><span /> <strong>{statusLabel(status)}</strong></div>
    </header>

    <div className="vault-boundary">
      <strong>Không di trú ngầm dữ liệu hiện có.</strong>
      <span>Dữ liệu thói quen/tăng trưởng hiện tại vẫn theo storage baseline. Chỉ payload được ghi qua Vault API mới được AES-GCM mã hóa trong IndexedDB.</span>
    </div>

    {status === "unsupported" ? <div className="vault-notice is-warning" role="status">Trình duyệt này thiếu Web Crypto hoặc IndexedDB cần thiết. Không tạo dữ liệu nhạy cảm mới trên thiết bị này.</div> : null}

    {status === "not-configured" ? <div className="vault-form">
      <label><span>Tạo mã khóa local</span><input type="password" autoComplete="new-password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder={`Ít nhất ${VAULT_MIN_PIN_LENGTH} ký tự`} minLength={VAULT_MIN_PIN_LENGTH} maxLength={128} /></label>
      <label><span>Nhập lại mã khóa</span><input type="password" autoComplete="new-password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} placeholder="Nhập lại" minLength={VAULT_MIN_PIN_LENGTH} maxLength={128} onKeyDown={(event) => { if (event.key === "Enter") void configure(); }} /></label>
      <button type="button" className="hf-primary vault-action" onClick={() => void configure()}>Tạo Secure Vault</button>
      <small>Nên dùng cụm mã khó đoán, không dùng ngày sinh hoặc mã thiết bị. V1 chưa có cơ chế khôi phục nếu quên mã.</small>
    </div> : null}

    {status === "locked" ? <div className="vault-form compact">
      <label><span>Mã khóa</span><input type="password" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} minLength={VAULT_MIN_PIN_LENGTH} maxLength={128} onKeyDown={(event) => { if (event.key === "Enter") void unlockNow(); }} /></label>
      <button type="button" className="hf-primary vault-action" onClick={() => void unlockNow()}>Mở Vault</button>
    </div> : null}

    {status === "unlocked" ? <div className="vault-open-panel">
      <div><span>Bản ghi mã hóa</span><strong>{recordCount ?? "—"}</strong></div>
      <div><span>Tự khóa</span><strong>10 phút không hoạt động · khóa khi rời trang</strong></div>
      <button type="button" className="hf-secondary vault-action" onClick={lockNow}>Khóa ngay</button>
    </div> : null}

    {notice ? <div className="vault-notice" role="status">{notice}</div> : null}

    <div className="vault-safety-grid">
      <article><strong>PIN không được lưu</strong><span>PIN chỉ dùng để dẫn xuất khóa; khóa giải mã chỉ giữ trong bộ nhớ khi Vault đang mở.</span></article>
      <article><strong>Cô lập theo hồ sơ</strong><span>AES-GCM dùng dữ liệu xác thực gắn với profileId; đổi profile phá phiên khóa cũ.</span></article>
      <article><strong>Không gửi sang Admin</strong><span>Vault key, PIN và ciphertext không được đưa vào Control Plane.</span></article>
      <article><strong>Không hứa khôi phục</strong><span>V1 chưa có recovery key. Quên mã khóa có thể khiến dữ liệu Vault không thể giải mã.</span></article>
    </div>

    <p className="vault-footnote">Mã hóa phía trình duyệt làm giảm rủi ro đọc trực tiếp dữ liệu lưu trữ, nhưng không được coi là bảo vệ tuyệt đối trước mã độc/XSS khi ứng dụng đang mở khóa.</p>
  </section>;
}
