"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";

export const PRIVATE_SENSITIVE_NOTES_DOMAIN_ID = "records-appointments-documents";
const PRIVATE_NOTE_KIND = "private-note-v1";
const MAX_NOTE_LENGTH = 2_000;

type PrivateNoteData = {
  kind: typeof PRIVATE_NOTE_KIND;
  text: string;
};

type PrivateNoteEnvelope = VaultPayloadEnvelope<PrivateNoteData>;

function isPrivateNote(record: VaultPayloadEnvelope<unknown>): record is PrivateNoteEnvelope {
  if (record.domainId !== PRIVATE_SENSITIVE_NOTES_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<PrivateNoteData>;
  return data.kind === PRIVATE_NOTE_KIND && typeof data.text === "string";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function PrivateSensitiveNotes() {
  const {
    profileId,
    status,
    key,
    refreshRecordCount,
    role,
    privacyReady,
    visibility,
    visibilityLabel,
    privacyAllowed,
  } = useSensitiveVaultDomain(PRIVATE_SENSITIVE_NOTES_DOMAIN_ID);
  const [notes, setNotes] = useState<PrivateNoteEnvelope[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setNotes([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const records = await listVaultRecords(key, profileId);
      setNotes(records.filter(isPrivateNote));
    } catch (error) {
      setNotes([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc ghi chú riêng tư.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadNotes(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNotes]);

  async function addNote() {
    const text = draft.trim();
    if (!privacyAllowed || status !== "unlocked" || !key || !text) return;
    const now = new Date().toISOString();
    const recordId = crypto.randomUUID();
    const payload: PrivateNoteEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId,
      domainId: PRIVATE_SENSITIVE_NOTES_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: { kind: PRIVATE_NOTE_KIND, text: text.slice(0, MAX_NOTE_LENGTH) },
    };
    setNotice("");
    try {
      await putVaultRecord(key, payload);
      setDraft("");
      await loadNotes();
      await refreshRecordCount();
      setNotice("Đã lưu ghi chú dưới dạng ciphertext trong Secure Vault của hồ sơ này.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể mã hóa và lưu ghi chú.");
    }
  }

  async function removeNote(note: PrivateNoteEnvelope) {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    if (!window.confirm("Xóa vĩnh viễn ghi chú riêng tư này khỏi Secure Vault?")) return;
    setNotice("");
    try {
      await deleteVaultRecord(key, profileId, note.recordId);
      await loadNotes();
      await refreshRecordCount();
      setNotice("Đã xóa ghi chú khỏi Secure Vault.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa ghi chú.");
    }
  }

  return <section className="private-notes" aria-label="Ghi chú riêng tư mã hóa">
    <header className="private-notes-head">
      <div>
        <span className="hf-kicker">Vault-backed · dữ liệu rất nhạy cảm</span>
        <h3>Ghi chú riêng tư</h3>
        <p>Chỉ đọc/ghi khi đúng quyền riêng tư của hồ sơ và Secure Vault đang mở.</p>
      </div>
      <div className="private-notes-state">
        <strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong>
        <span>{HEALTH_VIEWER_ROLE_LABELS[role]}</span>
      </div>
    </header>

    {!privacyReady ? <div className="private-notes-lock">Đang đọc policy local của hồ sơ…</div> : null}

    {privacyReady && visibility === "unconfigured" ? <div className="private-notes-lock is-warning">
      <strong>Khóa mặc định.</strong>
      <span>Trong Profile Privacy, hãy cấu hình miền “Hồ sơ, lịch hẹn & tài liệu y tế” trước. Không có plaintext fallback.</span>
    </div> : null}

    {privacyReady && visibility !== "unconfigured" && !privacyAllowed ? <div className="private-notes-lock">
      <strong>Ẩn với chế độ người đang xem hiện tại.</strong>
      <span>Ứng dụng không tải/decrypt danh sách ghi chú khi policy không cho phép.</span>
    </div> : null}

    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className="private-notes-lock">
      <strong>{status === "unsupported" ? "Secure Vault không được hỗ trợ trên trình duyệt này." : "Cần mở Secure Vault."}</strong>
      <span>Ghi chú không được lưu vào localStorage, DailyRecord, Timeline hoặc bản sao baseline.</span>
    </div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className="private-notes-compose">
        <label>
          <span>Nội dung riêng tư</span>
          <textarea
            value={draft}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Chỉ nhập điều cần lưu riêng. Không dùng module này để tự chẩn đoán hoặc thay thế tư vấn y tế."
          />
          <small>{draft.length}/{MAX_NOTE_LENGTH} · bản nháp chỉ nằm trong state của trang cho đến khi mã hóa.</small>
        </label>
        <button type="button" className="hf-primary private-notes-action" disabled={!draft.trim()} onClick={() => void addNote()}>Mã hóa & lưu</button>
      </div>

      <div className="private-notes-list" aria-live="polite">
        <div className="private-notes-list-head"><strong>Ghi chú đã mã hóa</strong><span>{loading ? "Đang giải mã…" : `${notes.length} mục`}</span></div>
        {!loading && notes.length === 0 ? <div className="private-notes-empty">Chưa có ghi chú riêng tư trong miền này.</div> : null}
        {notes.map((note) => <article key={note.recordId}>
          <div><small>{formatDateTime(note.updatedAt)}</small><p>{note.data.text}</p></div>
          <button type="button" className="private-notes-delete" onClick={() => void removeNote(note)}>Xóa</button>
        </article>)}
      </div>
    </> : null}

    {notice ? <div className="private-notes-notice" role="status">{notice}</div> : null}

    <p className="private-notes-footnote">Không đưa ghi chú này vào dashboard, Health Timeline, Site Quản trị hoặc backup baseline. Vai trò xem V1 vẫn là chế độ phiên chứ chưa phải xác thực danh tính pháp lý.</p>
  </section>;
}

export const PRIVATE_SENSITIVE_NOTES_V1_GUARDRAILS = {
  requiresConfiguredPrivacyScope: true,
  requiresViewerPermission: true,
  requiresUnlockedVault: true,
  noPlaintextFallback: true,
  excludedFromBaselineTimelineAndBackup: true,
  noAdminOrNetworkFlow: true,
  noDiagnosisOrClinicalScoring: true,
} as const;
