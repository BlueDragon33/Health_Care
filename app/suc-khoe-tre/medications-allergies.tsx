"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";

export const MEDICATIONS_ALLERGIES_DOMAIN_ID = "medications-allergies";
export const MEDICATION_RECORD_KIND = "medication-v1";
export const ALLERGY_RECORD_KIND = "allergy-v1";

const MAX_NAME = 120;
const MAX_INSTRUCTIONS = 700;
const MAX_REACTION = 700;
const MAX_SOURCE_NOTE = 240;
const MAX_NOTES = 1_000;

type SourceKind = "prescription" | "clinician" | "caregiver" | "known-record" | "other";
type MedicationRecordStatus = "current" | "past";

type MedicationData = {
  kind: typeof MEDICATION_RECORD_KIND;
  name: string;
  instructionsText: string;
  startDate: string;
  endDate: string;
  recordStatus: MedicationRecordStatus;
  sourceKind: SourceKind;
  sourceNote: string;
  notes: string;
};

type AllergyData = {
  kind: typeof ALLERGY_RECORD_KIND;
  substance: string;
  reactionText: string;
  sourceKind: SourceKind;
  sourceNote: string;
  notes: string;
};

type MedicationEnvelope = VaultPayloadEnvelope<MedicationData>;
type AllergyEnvelope = VaultPayloadEnvelope<AllergyData>;
type ModuleRecord = MedicationEnvelope | AllergyEnvelope;

type MedicationDraft = Omit<MedicationData, "kind">;
type AllergyDraft = Omit<AllergyData, "kind">;

const emptyMedication: MedicationDraft = {
  name: "",
  instructionsText: "",
  startDate: "",
  endDate: "",
  recordStatus: "current",
  sourceKind: "prescription",
  sourceNote: "",
  notes: "",
};

const emptyAllergy: AllergyDraft = {
  substance: "",
  reactionText: "",
  sourceKind: "clinician",
  sourceNote: "",
  notes: "",
};

const sourceLabels: Record<SourceKind, string> = {
  prescription: "Đơn thuốc / nhãn thuốc",
  clinician: "Bác sĩ / nhân viên y tế",
  caregiver: "Người chăm sóc nhập lại thông tin đã biết",
  "known-record": "Ghi lại từ thông tin đã được cung cấp",
  other: "Nguồn khác",
};

function validSource(value: unknown): value is SourceKind {
  return value === "prescription" || value === "clinician" || value === "caregiver" || value === "known-record" || value === "other";
}

function validDate(value: unknown) {
  return typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isMedication(record: VaultPayloadEnvelope<unknown>): record is MedicationEnvelope {
  if (record.domainId !== MEDICATIONS_ALLERGIES_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<MedicationData>;
  return data.kind === MEDICATION_RECORD_KIND
    && typeof data.name === "string"
    && typeof data.instructionsText === "string"
    && validDate(data.startDate)
    && validDate(data.endDate)
    && (data.recordStatus === "current" || data.recordStatus === "past")
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.notes === "string";
}

function isAllergy(record: VaultPayloadEnvelope<unknown>): record is AllergyEnvelope {
  if (record.domainId !== MEDICATIONS_ALLERGIES_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<AllergyData>;
  return data.kind === ALLERGY_RECORD_KIND
    && typeof data.substance === "string"
    && typeof data.reactionText === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.notes === "string";
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function MedicationsAllergies() {
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
  } = useSensitiveVaultDomain(MEDICATIONS_ALLERGIES_DOMAIN_ID);
  const [mode, setMode] = useState<"medication" | "allergy">("medication");
  const [medication, setMedication] = useState<MedicationDraft>(emptyMedication);
  const [allergy, setAllergy] = useState<AllergyDraft>(emptyAllergy);
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const medications = useMemo(() => records.filter((record): record is MedicationEnvelope => isMedication(record)), [records]);
  const allergies = useMemo(() => records.filter((record): record is AllergyEnvelope => isAllergy(record)), [records]);

  const loadRecords = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const vaultRecords = await listVaultRecords(key, profileId);
      setRecords(vaultRecords.filter((record): record is ModuleRecord => isMedication(record) || isAllergy(record)));
    } catch (error) {
      setRecords([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc dữ liệu thuốc và dị ứng.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  async function saveMedication() {
    const name = medication.name.trim().slice(0, MAX_NAME);
    if (!name || !privacyAllowed || status !== "unlocked" || !key) return;
    if (medication.startDate && medication.endDate && medication.endDate < medication.startDate) {
      setNotice("Ngày kết thúc không được trước ngày bắt đầu.");
      return;
    }
    const now = new Date().toISOString();
    const recordId = crypto.randomUUID();
    const payload: MedicationEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId,
      domainId: MEDICATIONS_ALLERGIES_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: MEDICATION_RECORD_KIND,
        name,
        instructionsText: medication.instructionsText.trim().slice(0, MAX_INSTRUCTIONS),
        startDate: medication.startDate,
        endDate: medication.endDate,
        recordStatus: medication.recordStatus,
        sourceKind: medication.sourceKind,
        sourceNote: medication.sourceNote.trim().slice(0, MAX_SOURCE_NOTE),
        notes: medication.notes.trim().slice(0, MAX_NOTES),
      },
    };
    setNotice("");
    try {
      await putVaultRecord(key, payload);
      setMedication(emptyMedication);
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu bản ghi thuốc. Ứng dụng không kiểm tra hoặc thay đổi hướng dẫn dùng thuốc đã nhập.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu bản ghi thuốc.");
    }
  }

  async function saveAllergy() {
    const substance = allergy.substance.trim().slice(0, MAX_NAME);
    if (!substance || !privacyAllowed || status !== "unlocked" || !key) return;
    const now = new Date().toISOString();
    const recordId = crypto.randomUUID();
    const payload: AllergyEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId,
      domainId: MEDICATIONS_ALLERGIES_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: ALLERGY_RECORD_KIND,
        substance,
        reactionText: allergy.reactionText.trim().slice(0, MAX_REACTION),
        sourceKind: allergy.sourceKind,
        sourceNote: allergy.sourceNote.trim().slice(0, MAX_SOURCE_NOTE),
        notes: allergy.notes.trim().slice(0, MAX_NOTES),
      },
    };
    setNotice("");
    try {
      await putVaultRecord(key, payload);
      setAllergy(emptyAllergy);
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu bản ghi dị ứng/phản ứng đã biết.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu bản ghi dị ứng.");
    }
  }

  async function removeRecord(record: ModuleRecord) {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    const label = isMedication(record) ? `thuốc “${record.data.name}”` : `dị ứng/phản ứng “${record.data.substance}”`;
    if (!window.confirm(`Xóa vĩnh viễn bản ghi ${label} khỏi Secure Vault?`)) return;
    setNotice("");
    try {
      await deleteVaultRecord(key, profileId, record.recordId);
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã xóa bản ghi khỏi Secure Vault.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa bản ghi.");
    }
  }

  return <section className="medall" aria-label="Thuốc và dị ứng mã hóa">
    <header className="medall-head">
      <div>
        <span className="hf-kicker">Medications & Allergies V1 · Secure Vault</span>
        <h3>Thuốc, dị ứng & thông tin cần nhớ</h3>
        <p>Đây là sổ ghi chép thông tin đã biết. Ứng dụng không tính liều, không đề xuất thuốc, không kiểm tra tương tác và không tự thay đổi điều trị.</p>
      </div>
      <div className="medall-state">
        <strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong>
        <span>{HEALTH_VIEWER_ROLE_LABELS[role]}</span>
      </div>
    </header>

    {!privacyReady ? <div className="medall-lock">Đang đọc quyền riêng tư của hồ sơ…</div> : null}
    {privacyReady && visibility === "unconfigured" ? <div className="medall-lock is-warning"><strong>Khóa mặc định.</strong><span>Hãy cấu hình miền “Thuốc, dị ứng & thông tin cần nhớ” trong Profile Privacy trước khi lưu dữ liệu.</span></div> : null}
    {privacyReady && visibility !== "unconfigured" && !privacyAllowed ? <div className="medall-lock"><strong>Ẩn với chế độ người đang xem hiện tại.</strong><span>Không tải hoặc giải mã dữ liệu thuốc/dị ứng khi policy không cho phép.</span></div> : null}
    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className="medall-lock"><strong>{status === "unsupported" ? "Trình duyệt không hỗ trợ Secure Vault." : "Cần mở Secure Vault."}</strong><span>Không có plaintext fallback vào hồ sơ thường, Timeline hay Site Quản trị.</span></div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className="medall-switch" role="group" aria-label="Loại bản ghi">
        <button type="button" className={mode === "medication" ? "is-selected" : ""} aria-pressed={mode === "medication"} onClick={() => setMode("medication")}><strong>Thuốc</strong><small>{medications.length} bản ghi</small></button>
        <button type="button" className={mode === "allergy" ? "is-selected" : ""} aria-pressed={mode === "allergy"} onClick={() => setMode("allergy")}><strong>Dị ứng / phản ứng</strong><small>{allergies.length} bản ghi</small></button>
      </div>

      {mode === "medication" ? <div className="medall-form">
        <div className="medall-form-head"><div><span className="hf-kicker">Bản ghi thuốc</span><h4>Nhập đúng thông tin đang có</h4></div><span>Không tính liều</span></div>
        <div className="medall-form-grid">
          <label><span>Tên thuốc / sản phẩm theo nhãn</span><input value={medication.name} maxLength={MAX_NAME} onChange={(event) => setMedication((current) => ({ ...current, name: event.target.value }))} /></label>
          <label><span>Trạng thái ghi chép</span><select value={medication.recordStatus} onChange={(event) => setMedication((current) => ({ ...current, recordStatus: event.target.value as MedicationRecordStatus }))}><option value="current">Đang được ghi nhận là đang dùng</option><option value="past">Đã dùng trước đây / đã kết thúc</option></select></label>
          <label><span>Ngày bắt đầu nếu biết</span><input type="date" value={medication.startDate} onChange={(event) => setMedication((current) => ({ ...current, startDate: event.target.value }))} /></label>
          <label><span>Ngày kết thúc nếu biết</span><input type="date" value={medication.endDate} onChange={(event) => setMedication((current) => ({ ...current, endDate: event.target.value }))} /></label>
          <label><span>Nguồn thông tin</span><select value={medication.sourceKind} onChange={(event) => setMedication((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn / nơi kê nếu muốn</span><input value={medication.sourceNote} maxLength={MAX_SOURCE_NOTE} onChange={(event) => setMedication((current) => ({ ...current, sourceNote: event.target.value }))} placeholder="Ví dụ: tên cơ sở / đơn ngày…" /></label>
        </div>
        <label className="medall-wide"><span>Hướng dẫn dùng — chép nguyên thông tin đã được cung cấp</span><textarea value={medication.instructionsText} maxLength={MAX_INSTRUCTIONS} onChange={(event) => setMedication((current) => ({ ...current, instructionsText: event.target.value }))} placeholder="Không nhờ ứng dụng tự tính hoặc suy ra liều." /></label>
        <label className="medall-wide"><span>Ghi chú thêm</span><textarea value={medication.notes} maxLength={MAX_NOTES} onChange={(event) => setMedication((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button type="button" className="hf-primary medall-action" disabled={!medication.name.trim()} onClick={() => void saveMedication()}>Mã hóa & lưu thuốc</button>
      </div> : null}

      {mode === "allergy" ? <div className="medall-form">
        <div className="medall-form-head"><div><span className="hf-kicker">Dị ứng / phản ứng</span><h4>Chỉ ghi điều đã biết</h4></div><span>Không tự phân loại mức độ</span></div>
        <div className="medall-form-grid">
          <label><span>Chất / thuốc / thực phẩm được ghi nhận</span><input value={allergy.substance} maxLength={MAX_NAME} onChange={(event) => setAllergy((current) => ({ ...current, substance: event.target.value }))} /></label>
          <label><span>Nguồn thông tin</span><select value={allergy.sourceKind} onChange={(event) => setAllergy((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn nếu muốn</span><input value={allergy.sourceNote} maxLength={MAX_SOURCE_NOTE} onChange={(event) => setAllergy((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        </div>
        <label className="medall-wide"><span>Phản ứng đã từng được ghi nhận / quan sát</span><textarea value={allergy.reactionText} maxLength={MAX_REACTION} onChange={(event) => setAllergy((current) => ({ ...current, reactionText: event.target.value }))} placeholder="Ghi mô tả đã biết; ứng dụng không tự kết luận dị ứng." /></label>
        <label className="medall-wide"><span>Ghi chú thêm</span><textarea value={allergy.notes} maxLength={MAX_NOTES} onChange={(event) => setAllergy((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button type="button" className="hf-primary medall-action" disabled={!allergy.substance.trim()} onClick={() => void saveAllergy()}>Mã hóa & lưu dị ứng</button>
      </div> : null}

      <div className="medall-records" aria-live="polite">
        <div className="medall-records-head"><div><span className="hf-kicker">Secure Vault</span><h4>Bản ghi đã mã hóa</h4></div><span>{loading ? "Đang giải mã…" : `${records.length} mục`}</span></div>
        {!loading && records.length === 0 ? <div className="medall-empty">Chưa có bản ghi thuốc hoặc dị ứng trong Vault của hồ sơ này.</div> : null}
        {medications.map((record) => <article key={record.recordId} className="medall-record">
          <div className="medall-record-copy"><span>Thuốc · {record.data.recordStatus === "current" ? "đang được ghi nhận là đang dùng" : "đã dùng trước đây"}</span><strong>{record.data.name}</strong>{record.data.instructionsText ? <p>{record.data.instructionsText}</p> : null}<small>{record.data.startDate || record.data.endDate ? `${formatDate(record.data.startDate)} → ${formatDate(record.data.endDate)}` : "Không ghi khoảng ngày"} · {sourceLabels[record.data.sourceKind]} · cập nhật {formatDateTime(record.updatedAt)}</small>{record.data.sourceNote ? <small>Nguồn: {record.data.sourceNote}</small> : null}{record.data.notes ? <small>Ghi chú: {record.data.notes}</small> : null}</div>
          <button type="button" className="medall-delete" onClick={() => void removeRecord(record)}>Xóa</button>
        </article>)}
        {allergies.map((record) => <article key={record.recordId} className="medall-record is-allergy">
          <div className="medall-record-copy"><span>Dị ứng / phản ứng đã ghi nhận</span><strong>{record.data.substance}</strong>{record.data.reactionText ? <p>{record.data.reactionText}</p> : null}<small>{sourceLabels[record.data.sourceKind]} · cập nhật {formatDateTime(record.updatedAt)}</small>{record.data.sourceNote ? <small>Nguồn: {record.data.sourceNote}</small> : null}{record.data.notes ? <small>Ghi chú: {record.data.notes}</small> : null}</div>
          <button type="button" className="medall-delete" onClick={() => void removeRecord(record)}>Xóa</button>
        </article>)}
      </div>
    </> : null}

    {notice ? <div className="medall-notice" role="status" aria-live="polite">{notice}</div> : null}

    <div className="medall-safety">
      <strong>Ranh giới V1</strong>
      <span>Không tự tạo nhắc dùng thuốc từ tên/liều vì Reminder Engine baseline hiện chưa phải kho dữ liệu rất nhạy cảm. Không tự tính liều, kiểm tra tương tác, khuyên ngừng/đổi thuốc hay chẩn đoán dị ứng.</span>
    </div>
  </section>;
}

export const MEDICATIONS_ALLERGIES_V1_GUARDRAILS = {
  requiresConfiguredPrivacyScope: true,
  requiresViewerPermission: true,
  requiresUnlockedVault: true,
  vaultOnlyPersistence: true,
  encryptedBackupIncludedByVault: true,
  noPlaintextReminderLeakage: true,
  noDoseCalculation: true,
  noMedicationRecommendation: true,
  noInteractionEngine: true,
  noAutomaticTreatmentChange: true,
  noAllergyDiagnosis: true,
  noAdminOrNetworkFlow: true,
} as const;
