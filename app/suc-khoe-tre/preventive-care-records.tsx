"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";

export const PREVENTIVE_CARE_DOMAIN_ID = "preventive-care";
export const PREVENTIVE_VISIT_RECORD_KIND = "preventive-visit-v1";
export const IMMUNIZATION_RECORD_KIND = "immunization-record-v1";

const MAX_SHORT = 140;
const MAX_MEDIUM = 420;
const MAX_LONG = 1_200;

type SourceKind = "clinician" | "medical-document" | "caregiver" | "known-record" | "other";
type VisitType = "primary-care" | "dental" | "vision" | "hearing" | "school-health" | "other";

type PreventiveVisitData = {
  kind: typeof PREVENTIVE_VISIT_RECORD_KIND;
  visitType: VisitType;
  title: string;
  visitDate: string;
  facility: string;
  clinician: string;
  summary: string;
  sourceKind: SourceKind;
  sourceNote: string;
};

type ImmunizationData = {
  kind: typeof IMMUNIZATION_RECORD_KIND;
  vaccineName: string;
  administeredDate: string;
  doseLabel: string;
  manufacturerOrProduct: string;
  lotNumber: string;
  facility: string;
  sourceKind: SourceKind;
  sourceNote: string;
  notes: string;
};

type VisitEnvelope = VaultPayloadEnvelope<PreventiveVisitData>;
type ImmunizationEnvelope = VaultPayloadEnvelope<ImmunizationData>;
type ModuleRecord = VisitEnvelope | ImmunizationEnvelope;

const sourceLabels: Record<SourceKind, string> = {
  clinician: "Bác sĩ / nhân viên y tế",
  "medical-document": "Sổ / hồ sơ / giấy xác nhận y tế",
  caregiver: "Người chăm sóc nhập lại thông tin đã biết",
  "known-record": "Thông tin đã được xác nhận trước đó",
  other: "Nguồn khác",
};

const visitLabels: Record<VisitType, string> = {
  "primary-care": "Khám sức khỏe / chăm sóc ban đầu",
  dental: "Nha khoa",
  vision: "Mắt / thị lực",
  hearing: "Tai / thính lực",
  "school-health": "Khám / sàng lọc học đường",
  other: "Khám phòng ngừa khác",
};

function validSource(value: unknown): value is SourceKind {
  return value === "clinician" || value === "medical-document" || value === "caregiver" || value === "known-record" || value === "other";
}

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isVisit(record: VaultPayloadEnvelope<unknown>): record is VisitEnvelope {
  if (record.domainId !== PREVENTIVE_CARE_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<PreventiveVisitData>;
  return data.kind === PREVENTIVE_VISIT_RECORD_KIND
    && (data.visitType === "primary-care" || data.visitType === "dental" || data.visitType === "vision" || data.visitType === "hearing" || data.visitType === "school-health" || data.visitType === "other")
    && typeof data.title === "string"
    && validDate(data.visitDate)
    && typeof data.facility === "string"
    && typeof data.clinician === "string"
    && typeof data.summary === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string";
}

function isImmunization(record: VaultPayloadEnvelope<unknown>): record is ImmunizationEnvelope {
  if (record.domainId !== PREVENTIVE_CARE_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<ImmunizationData>;
  return data.kind === IMMUNIZATION_RECORD_KIND
    && typeof data.vaccineName === "string"
    && validDate(data.administeredDate)
    && typeof data.doseLabel === "string"
    && typeof data.manufacturerOrProduct === "string"
    && typeof data.lotNumber === "string"
    && typeof data.facility === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.notes === "string";
}

function clip(value: string, max = MAX_MEDIUM) {
  return value.trim().slice(0, max);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export default function PreventiveCareRecords() {
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
  } = useSensitiveVaultDomain(PREVENTIVE_CARE_DOMAIN_ID);

  const [mode, setMode] = useState<"visit" | "immunization">("visit");
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [visit, setVisit] = useState({ visitType: "primary-care" as VisitType, title: "", visitDate: "", facility: "", clinician: "", summary: "", sourceKind: "clinician" as SourceKind, sourceNote: "" });
  const [immunization, setImmunization] = useState({ vaccineName: "", administeredDate: "", doseLabel: "", manufacturerOrProduct: "", lotNumber: "", facility: "", sourceKind: "medical-document" as SourceKind, sourceNote: "", notes: "" });

  const visits = useMemo(() => records.filter((record): record is VisitEnvelope => isVisit(record)), [records]);
  const immunizations = useMemo(() => records.filter((record): record is ImmunizationEnvelope => isImmunization(record)), [records]);

  const loadRecords = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const vaultRecords = await listVaultRecords(key, profileId);
      setRecords(vaultRecords.filter((record): record is ModuleRecord => isVisit(record) || isImmunization(record)));
    } catch (error) {
      setRecords([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc hồ sơ phòng ngừa và tiêm chủng.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  async function saveVisit() {
    const title = clip(visit.title, MAX_SHORT);
    if (!title || !visit.visitDate || !privacyAllowed || status !== "unlocked" || !key) return;
    const now = new Date().toISOString();
    const payload: VisitEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: PREVENTIVE_CARE_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: PREVENTIVE_VISIT_RECORD_KIND,
        visitType: visit.visitType,
        title,
        visitDate: visit.visitDate,
        facility: clip(visit.facility, MAX_SHORT),
        clinician: clip(visit.clinician, MAX_SHORT),
        summary: clip(visit.summary, MAX_LONG),
        sourceKind: visit.sourceKind,
        sourceNote: clip(visit.sourceNote, MAX_MEDIUM),
      },
    };
    try {
      await putVaultRecord(key, payload);
      setVisit({ visitType: "primary-care", title: "", visitDate: "", facility: "", clinician: "", summary: "", sourceKind: "clinician", sourceNote: "" });
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu lần khám/phòng ngừa đã thực hiện.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu lần khám.");
    }
  }

  async function saveImmunization() {
    const vaccineName = clip(immunization.vaccineName, MAX_SHORT);
    if (!vaccineName || !immunization.administeredDate || !privacyAllowed || status !== "unlocked" || !key) return;
    const now = new Date().toISOString();
    const payload: ImmunizationEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: PREVENTIVE_CARE_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: IMMUNIZATION_RECORD_KIND,
        vaccineName,
        administeredDate: immunization.administeredDate,
        doseLabel: clip(immunization.doseLabel, MAX_SHORT),
        manufacturerOrProduct: clip(immunization.manufacturerOrProduct, MAX_SHORT),
        lotNumber: clip(immunization.lotNumber, MAX_SHORT),
        facility: clip(immunization.facility, MAX_SHORT),
        sourceKind: immunization.sourceKind,
        sourceNote: clip(immunization.sourceNote, MAX_MEDIUM),
        notes: clip(immunization.notes, MAX_LONG),
      },
    };
    try {
      await putVaultRecord(key, payload);
      setImmunization({ vaccineName: "", administeredDate: "", doseLabel: "", manufacturerOrProduct: "", lotNumber: "", facility: "", sourceKind: "medical-document", sourceNote: "", notes: "" });
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu mũi tiêm đã được ghi nhận. Ứng dụng không tự suy lịch tiêm hoặc đánh dấu quá hạn.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu bản ghi tiêm chủng.");
    }
  }

  async function removeRecord(record: ModuleRecord) {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    if (!window.confirm("Xóa vĩnh viễn bản ghi này khỏi Secure Vault?")) return;
    try {
      await deleteVaultRecord(key, profileId, record.recordId);
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã xóa bản ghi khỏi Secure Vault.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa bản ghi.");
    }
  }

  return <section className="pcr" aria-label="Khám phòng ngừa và tiêm chủng mã hóa">
    <header className="pcr-head">
      <div>
        <span className="hf-kicker">Preventive Care & Immunization Records V1 · Secure Vault</span>
        <h3>Khám phòng ngừa & tiêm chủng đã thực hiện</h3>
        <p>Chỉ lưu lịch sử đã xảy ra hoặc đã được xác nhận. V1 không tự suy lịch tiêm, không dùng lịch của một quốc gia làm mặc định và không tự đánh dấu “quá hạn”.</p>
      </div>
      <div className="pcr-state"><strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong><span>{HEALTH_VIEWER_ROLE_LABELS[role]}</span></div>
    </header>

    {!privacyReady ? <div className="pcr-lock">Đang đọc quyền riêng tư của hồ sơ…</div> : null}
    {privacyReady && !privacyAllowed ? <div className="pcr-lock"><strong>Không có quyền xem miền này ở chế độ hiện tại.</strong><span>Không tải hoặc giải mã dữ liệu phòng ngừa khi policy không cho phép.</span></div> : null}
    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className="pcr-lock"><strong>{status === "unsupported" ? "Trình duyệt không hỗ trợ Secure Vault." : "Cần mở Secure Vault."}</strong><span>Không có plaintext fallback vào hồ sơ thường, Timeline hoặc Site Quản trị.</span></div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className="pcr-switch" role="group" aria-label="Loại hồ sơ phòng ngừa">
        <button type="button" className={mode === "visit" ? "is-selected" : ""} aria-pressed={mode === "visit"} onClick={() => setMode("visit")}><strong>Khám / chăm sóc phòng ngừa</strong><small>{visits.length} bản ghi</small></button>
        <button type="button" className={mode === "immunization" ? "is-selected" : ""} aria-pressed={mode === "immunization"} onClick={() => setMode("immunization")}><strong>Tiêm chủng đã thực hiện</strong><small>{immunizations.length} bản ghi</small></button>
      </div>

      {mode === "visit" ? <div className="pcr-panel">
        <div className="pcr-panel-head"><div><span className="hf-kicker">Preventive visit</span><h4>Ghi lần khám đã thực hiện</h4></div><span>Không tự sinh lịch kế tiếp</span></div>
        <div className="pcr-grid">
          <label><span>Loại khám</span><select value={visit.visitType} onChange={(event) => setVisit((current) => ({ ...current, visitType: event.target.value as VisitType }))}>{Object.entries(visitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Tên / mục đích theo hồ sơ</span><input value={visit.title} maxLength={MAX_SHORT} onChange={(event) => setVisit((current) => ({ ...current, title: event.target.value }))} /></label>
          <label><span>Ngày đã khám</span><input type="date" value={visit.visitDate} onChange={(event) => setVisit((current) => ({ ...current, visitDate: event.target.value }))} /></label>
          <label><span>Cơ sở</span><input value={visit.facility} maxLength={MAX_SHORT} onChange={(event) => setVisit((current) => ({ ...current, facility: event.target.value }))} /></label>
          <label><span>Bác sĩ / nhân viên y tế nếu muốn</span><input value={visit.clinician} maxLength={MAX_SHORT} onChange={(event) => setVisit((current) => ({ ...current, clinician: event.target.value }))} /></label>
          <label><span>Nguồn</span><select value={visit.sourceKind} onChange={(event) => setVisit((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <label className="pcr-wide"><span>Tóm tắt kết quả / việc đã làm — chép từ nguồn</span><textarea value={visit.summary} maxLength={MAX_LONG} onChange={(event) => setVisit((current) => ({ ...current, summary: event.target.value }))} /></label>
        <label className="pcr-wide"><span>Ghi nguồn / tài liệu</span><input value={visit.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setVisit((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        <button type="button" className="hf-primary pcr-save" disabled={!visit.title.trim() || !visit.visitDate} onClick={() => void saveVisit()}>Mã hóa & lưu lần khám</button>
      </div> : null}

      {mode === "immunization" ? <div className="pcr-panel">
        <div className="pcr-panel-head"><div><span className="hf-kicker">Immunization record</span><h4>Ghi mũi tiêm đã được thực hiện</h4></div><span>Không suy lịch tiêm</span></div>
        <div className="pcr-grid">
          <label><span>Tên vaccine theo sổ / giấy xác nhận</span><input value={immunization.vaccineName} maxLength={MAX_SHORT} onChange={(event) => setImmunization((current) => ({ ...current, vaccineName: event.target.value }))} /></label>
          <label><span>Ngày tiêm</span><input type="date" value={immunization.administeredDate} onChange={(event) => setImmunization((current) => ({ ...current, administeredDate: event.target.value }))} /></label>
          <label><span>Mũi / liều ghi trên hồ sơ nếu có</span><input value={immunization.doseLabel} maxLength={MAX_SHORT} onChange={(event) => setImmunization((current) => ({ ...current, doseLabel: event.target.value }))} /></label>
          <label><span>Sản phẩm / nhà sản xuất nếu có</span><input value={immunization.manufacturerOrProduct} maxLength={MAX_SHORT} onChange={(event) => setImmunization((current) => ({ ...current, manufacturerOrProduct: event.target.value }))} /></label>
          <label><span>Số lô nếu có</span><input value={immunization.lotNumber} maxLength={MAX_SHORT} onChange={(event) => setImmunization((current) => ({ ...current, lotNumber: event.target.value }))} /></label>
          <label><span>Cơ sở tiêm</span><input value={immunization.facility} maxLength={MAX_SHORT} onChange={(event) => setImmunization((current) => ({ ...current, facility: event.target.value }))} /></label>
          <label><span>Nguồn</span><select value={immunization.sourceKind} onChange={(event) => setImmunization((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn / giấy tờ</span><input value={immunization.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setImmunization((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        </div>
        <label className="pcr-wide"><span>Ghi chú</span><textarea value={immunization.notes} maxLength={MAX_LONG} onChange={(event) => setImmunization((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button type="button" className="hf-primary pcr-save" disabled={!immunization.vaccineName.trim() || !immunization.administeredDate} onClick={() => void saveImmunization()}>Mã hóa & lưu mũi tiêm</button>
      </div> : null}

      <div className="pcr-records" aria-live="polite">
        <div className="pcr-records-head"><strong>Lịch sử đã ghi</strong><span>{loading ? "Đang giải mã…" : mode === "visit" ? `${visits.length} mục` : `${immunizations.length} mục`}</span></div>
        {!loading && mode === "visit" ? visits.map((record) => <article key={record.recordId}><div><small>{visitLabels[record.data.visitType]}</small><strong>{record.data.title}</strong><p>{formatDate(record.data.visitDate)}{record.data.facility ? ` · ${record.data.facility}` : ""}</p><span>{sourceLabels[record.data.sourceKind]}</span></div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
        {!loading && mode === "immunization" ? immunizations.map((record) => <article key={record.recordId}><div><small>Tiêm chủng đã ghi</small><strong>{record.data.vaccineName}</strong><p>{formatDate(record.data.administeredDate)}{record.data.doseLabel ? ` · ${record.data.doseLabel}` : ""}</p><span>{record.data.facility || sourceLabels[record.data.sourceKind]}</span></div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
      </div>
    </> : null}

    {notice ? <div className="pcr-notice" role="status">{notice}</div> : null}
    <p className="pcr-footnote">V1 chỉ lưu lịch sử đã xác nhận. Không có due/catch-up engine, không tự gắn “đủ/chưa đủ”, không đề xuất vaccine và không dùng lịch nước ngoài làm mặc định cho Việt Nam. Dữ liệu đi cùng encrypted Vault backup, không sang Site Quản trị.</p>
  </section>;
}

export const PREVENTIVE_CARE_RECORDS_V1_GUARDRAILS = {
  vaultOnlyPersistence: true,
  encryptedBackupIncluded: true,
  noAdminOrNetworkFlow: true,
  noAutomaticImmunizationSchedule: true,
  noAutomaticDueOrOverdueStatus: true,
  noCountryScheduleAssumption: true,
  noVaccineRecommendation: true,
  noGeneratedNextVisit: true,
  provenanceRequiredBySchema: true,
} as const;
