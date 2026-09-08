"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";

export const CHRONIC_CONDITIONS_DOMAIN_ID = "chronic-conditions-care-plans";
export const CONDITION_RECORD_KIND = "chronic-condition-v1";
export const HISTORY_EVENT_RECORD_KIND = "medical-history-event-v1";
export const CARE_PLAN_RECORD_KIND = "care-plan-v1";

const MAX_SHORT = 140;
const MAX_MEDIUM = 420;
const MAX_LONG = 1_400;

type SourceKind = "clinician" | "medical-document" | "caregiver" | "known-record" | "other";
type ConditionStatus = "active" | "inactive" | "resolved-recorded";
type CarePlanStatus = "active" | "archived";
type HistoryEventType = "hospitalization" | "surgery" | "emergency" | "procedure" | "other";

type ConditionData = {
  kind: typeof CONDITION_RECORD_KIND;
  name: string;
  conditionStatus: ConditionStatus;
  knownSince: string;
  specialty: string;
  clinicianOrFacility: string;
  sourceKind: SourceKind;
  sourceNote: string;
  notes: string;
};

type HistoryEventData = {
  kind: typeof HISTORY_EVENT_RECORD_KIND;
  eventType: HistoryEventType;
  title: string;
  eventDate: string;
  facility: string;
  summary: string;
  sourceKind: SourceKind;
  sourceNote: string;
};

type CarePlanData = {
  kind: typeof CARE_PLAN_RECORD_KIND;
  title: string;
  planStatus: CarePlanStatus;
  planText: string;
  clinicianInstructions: string;
  schoolSupport: string;
  followUpText: string;
  sourceKind: SourceKind;
  sourceNote: string;
};

type ConditionEnvelope = VaultPayloadEnvelope<ConditionData>;
type HistoryEnvelope = VaultPayloadEnvelope<HistoryEventData>;
type CarePlanEnvelope = VaultPayloadEnvelope<CarePlanData>;
type ModuleRecord = ConditionEnvelope | HistoryEnvelope | CarePlanEnvelope;

const sourceLabels: Record<SourceKind, string> = {
  clinician: "Bác sĩ / nhân viên y tế",
  "medical-document": "Hồ sơ / tài liệu y tế",
  caregiver: "Người chăm sóc nhập lại thông tin đã biết",
  "known-record": "Thông tin đã được xác định trước đó",
  other: "Nguồn khác",
};

const eventLabels: Record<HistoryEventType, string> = {
  hospitalization: "Nhập viện",
  surgery: "Phẫu thuật",
  emergency: "Cấp cứu",
  procedure: "Thủ thuật / can thiệp",
  other: "Sự kiện y tế khác",
};

function validSource(value: unknown): value is SourceKind {
  return value === "clinician" || value === "medical-document" || value === "caregiver" || value === "known-record" || value === "other";
}

function validDate(value: unknown) {
  return typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isCondition(record: VaultPayloadEnvelope<unknown>): record is ConditionEnvelope {
  if (record.domainId !== CHRONIC_CONDITIONS_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<ConditionData>;
  return data.kind === CONDITION_RECORD_KIND
    && typeof data.name === "string"
    && (data.conditionStatus === "active" || data.conditionStatus === "inactive" || data.conditionStatus === "resolved-recorded")
    && validDate(data.knownSince)
    && typeof data.specialty === "string"
    && typeof data.clinicianOrFacility === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.notes === "string";
}

function isHistory(record: VaultPayloadEnvelope<unknown>): record is HistoryEnvelope {
  if (record.domainId !== CHRONIC_CONDITIONS_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<HistoryEventData>;
  return data.kind === HISTORY_EVENT_RECORD_KIND
    && (data.eventType === "hospitalization" || data.eventType === "surgery" || data.eventType === "emergency" || data.eventType === "procedure" || data.eventType === "other")
    && typeof data.title === "string"
    && validDate(data.eventDate)
    && typeof data.facility === "string"
    && typeof data.summary === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string";
}

function isCarePlan(record: VaultPayloadEnvelope<unknown>): record is CarePlanEnvelope {
  if (record.domainId !== CHRONIC_CONDITIONS_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<CarePlanData>;
  return data.kind === CARE_PLAN_RECORD_KIND
    && typeof data.title === "string"
    && (data.planStatus === "active" || data.planStatus === "archived")
    && typeof data.planText === "string"
    && typeof data.clinicianInstructions === "string"
    && typeof data.schoolSupport === "string"
    && typeof data.followUpText === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string";
}

function clip(value: string, max = MAX_MEDIUM) {
  return value.trim().slice(0, max);
}

function formatDate(value: string) {
  if (!value) return "Không ghi ngày";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

export default function ChronicConditionsCarePlans() {
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
  } = useSensitiveVaultDomain(CHRONIC_CONDITIONS_DOMAIN_ID);

  const [mode, setMode] = useState<"condition" | "history" | "care-plan">("condition");
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const [condition, setCondition] = useState({ name: "", conditionStatus: "active" as ConditionStatus, knownSince: "", specialty: "", clinicianOrFacility: "", sourceKind: "clinician" as SourceKind, sourceNote: "", notes: "" });
  const [history, setHistory] = useState({ eventType: "hospitalization" as HistoryEventType, title: "", eventDate: "", facility: "", summary: "", sourceKind: "medical-document" as SourceKind, sourceNote: "" });
  const [carePlan, setCarePlan] = useState({ title: "", planStatus: "active" as CarePlanStatus, planText: "", clinicianInstructions: "", schoolSupport: "", followUpText: "", sourceKind: "clinician" as SourceKind, sourceNote: "" });

  const conditions = useMemo(() => records.filter((record): record is ConditionEnvelope => isCondition(record)), [records]);
  const historyEvents = useMemo(() => records.filter((record): record is HistoryEnvelope => isHistory(record)), [records]);
  const carePlans = useMemo(() => records.filter((record): record is CarePlanEnvelope => isCarePlan(record)), [records]);

  const loadRecords = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const vaultRecords = await listVaultRecords(key, profileId);
      setRecords(vaultRecords.filter((record): record is ModuleRecord => isCondition(record) || isHistory(record) || isCarePlan(record)));
    } catch (error) {
      setRecords([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc dữ liệu bệnh nền và kế hoạch chăm sóc.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  async function saveCondition() {
    const name = clip(condition.name, MAX_SHORT);
    if (!name || !privacyAllowed || status !== "unlocked" || !key) return;
    const now = new Date().toISOString();
    const payload: ConditionEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: CHRONIC_CONDITIONS_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: CONDITION_RECORD_KIND,
        name,
        conditionStatus: condition.conditionStatus,
        knownSince: condition.knownSince,
        specialty: clip(condition.specialty, MAX_SHORT),
        clinicianOrFacility: clip(condition.clinicianOrFacility, MAX_SHORT),
        sourceKind: condition.sourceKind,
        sourceNote: clip(condition.sourceNote, MAX_MEDIUM),
        notes: clip(condition.notes, MAX_LONG),
      },
    };
    try {
      await putVaultRecord(key, payload);
      setCondition({ name: "", conditionStatus: "active", knownSince: "", specialty: "", clinicianOrFacility: "", sourceKind: "clinician", sourceNote: "", notes: "" });
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu tình trạng đã được ghi nhận. Ứng dụng không tự tạo chẩn đoán mới.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu tình trạng sức khỏe.");
    }
  }

  async function saveHistory() {
    const title = clip(history.title, MAX_SHORT);
    if (!title || !history.eventDate || !privacyAllowed || status !== "unlocked" || !key) return;
    const now = new Date().toISOString();
    const payload: HistoryEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: CHRONIC_CONDITIONS_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: HISTORY_EVENT_RECORD_KIND,
        eventType: history.eventType,
        title,
        eventDate: history.eventDate,
        facility: clip(history.facility, MAX_SHORT),
        summary: clip(history.summary, MAX_LONG),
        sourceKind: history.sourceKind,
        sourceNote: clip(history.sourceNote, MAX_MEDIUM),
      },
    };
    try {
      await putVaultRecord(key, payload);
      setHistory({ eventType: "hospitalization", title: "", eventDate: "", facility: "", summary: "", sourceKind: "medical-document", sourceNote: "" });
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu sự kiện tiền sử y tế.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu tiền sử y tế.");
    }
  }

  async function saveCarePlan() {
    const title = clip(carePlan.title, MAX_SHORT);
    if (!title || !privacyAllowed || status !== "unlocked" || !key) return;
    const now = new Date().toISOString();
    const payload: CarePlanEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: CHRONIC_CONDITIONS_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: CARE_PLAN_RECORD_KIND,
        title,
        planStatus: carePlan.planStatus,
        planText: clip(carePlan.planText, MAX_LONG),
        clinicianInstructions: clip(carePlan.clinicianInstructions, MAX_LONG),
        schoolSupport: clip(carePlan.schoolSupport, MAX_LONG),
        followUpText: clip(carePlan.followUpText, MAX_MEDIUM),
        sourceKind: carePlan.sourceKind,
        sourceNote: clip(carePlan.sourceNote, MAX_MEDIUM),
      },
    };
    try {
      await putVaultRecord(key, payload);
      setCarePlan({ title: "", planStatus: "active", planText: "", clinicianInstructions: "", schoolSupport: "", followUpText: "", sourceKind: "clinician", sourceNote: "" });
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu kế hoạch chăm sóc đúng theo nội dung được nhập.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu kế hoạch chăm sóc.");
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

  return <section className="cccp" aria-label="Bệnh nền, tiền sử và kế hoạch chăm sóc mã hóa">
    <header className="cccp-head">
      <div>
        <span className="hf-kicker">Chronic Conditions & Care Plans V1 · Secure Vault</span>
        <h3>Bệnh nền, tiền sử & kế hoạch chăm sóc</h3>
        <p>Chỉ ghi lại thông tin đã được xác định hoặc chép từ hồ sơ/chuyên gia y tế. Ứng dụng không tự sinh chẩn đoán, không thay đổi kế hoạch điều trị và không tự đưa hướng dẫn xử trí mới.</p>
      </div>
      <div className="cccp-state"><strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong><span>{HEALTH_VIEWER_ROLE_LABELS[role]}</span></div>
    </header>

    {!privacyReady ? <div className="cccp-lock">Đang đọc quyền riêng tư của hồ sơ…</div> : null}
    {privacyReady && visibility === "unconfigured" ? <div className="cccp-lock is-warning"><strong>Khóa mặc định.</strong><span>Hãy cấu hình miền “Bệnh nền, tiền sử & kế hoạch chăm sóc” trong Profile Privacy trước.</span></div> : null}
    {privacyReady && visibility !== "unconfigured" && !privacyAllowed ? <div className="cccp-lock"><strong>Ẩn với chế độ người đang xem hiện tại.</strong><span>Không tải hoặc giải mã dữ liệu khi policy không cho phép.</span></div> : null}
    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className="cccp-lock"><strong>{status === "unsupported" ? "Trình duyệt không hỗ trợ Secure Vault." : "Cần mở Secure Vault."}</strong><span>Không có plaintext fallback vào hồ sơ thường, Timeline hay Site Quản trị.</span></div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className="cccp-switch" role="group" aria-label="Loại bản ghi">
        <button type="button" className={mode === "condition" ? "is-selected" : ""} aria-pressed={mode === "condition"} onClick={() => setMode("condition")}><strong>Bệnh nền / tình trạng</strong><small>{conditions.length} bản ghi</small></button>
        <button type="button" className={mode === "history" ? "is-selected" : ""} aria-pressed={mode === "history"} onClick={() => setMode("history")}><strong>Tiền sử y tế</strong><small>{historyEvents.length} bản ghi</small></button>
        <button type="button" className={mode === "care-plan" ? "is-selected" : ""} aria-pressed={mode === "care-plan"} onClick={() => setMode("care-plan")}><strong>Kế hoạch chăm sóc</strong><small>{carePlans.length} bản ghi</small></button>
      </div>

      {mode === "condition" ? <div className="cccp-panel">
        <div className="cccp-panel-head"><div><span className="hf-kicker">Problem list</span><h4>Ghi tình trạng đã được xác định</h4></div><span>Không tự chẩn đoán</span></div>
        <div className="cccp-grid">
          <label><span>Tên tình trạng / bệnh nền đã biết</span><input value={condition.name} maxLength={MAX_SHORT} onChange={(event) => setCondition((current) => ({ ...current, name: event.target.value }))} /></label>
          <label><span>Trạng thái ghi nhận</span><select value={condition.conditionStatus} onChange={(event) => setCondition((current) => ({ ...current, conditionStatus: event.target.value as ConditionStatus }))}><option value="active">Đang được theo dõi</option><option value="inactive">Không còn hoạt động / không còn theo dõi thường xuyên</option><option value="resolved-recorded">Đã được ghi nhận là đã giải quyết</option></select></label>
          <label><span>Biết từ ngày nếu có</span><input type="date" value={condition.knownSince} onChange={(event) => setCondition((current) => ({ ...current, knownSince: event.target.value }))} /></label>
          <label><span>Chuyên khoa đang theo dõi nếu có</span><input value={condition.specialty} maxLength={MAX_SHORT} onChange={(event) => setCondition((current) => ({ ...current, specialty: event.target.value }))} /></label>
          <label><span>Bác sĩ / cơ sở theo dõi nếu muốn</span><input value={condition.clinicianOrFacility} maxLength={MAX_SHORT} onChange={(event) => setCondition((current) => ({ ...current, clinicianOrFacility: event.target.value }))} /></label>
          <label><span>Nguồn</span><select value={condition.sourceKind} onChange={(event) => setCondition((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <label className="cccp-wide"><span>Ghi nguồn / tài liệu</span><input value={condition.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setCondition((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        <label className="cccp-wide"><span>Ghi chú</span><textarea value={condition.notes} maxLength={MAX_LONG} onChange={(event) => setCondition((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button type="button" className="hf-primary cccp-save" disabled={!condition.name.trim()} onClick={() => void saveCondition()}>Mã hóa & lưu tình trạng</button>
      </div> : null}

      {mode === "history" ? <div className="cccp-panel">
        <div className="cccp-panel-head"><div><span className="hf-kicker">Medical history</span><h4>Nhập viện, phẫu thuật & sự kiện đã xảy ra</h4></div><span>Ghi sự kiện đã biết</span></div>
        <div className="cccp-grid">
          <label><span>Loại sự kiện</span><select value={history.eventType} onChange={(event) => setHistory((current) => ({ ...current, eventType: event.target.value as HistoryEventType }))}>{Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Tên sự kiện</span><input value={history.title} maxLength={MAX_SHORT} onChange={(event) => setHistory((current) => ({ ...current, title: event.target.value }))} /></label>
          <label><span>Ngày</span><input type="date" value={history.eventDate} onChange={(event) => setHistory((current) => ({ ...current, eventDate: event.target.value }))} /></label>
          <label><span>Cơ sở y tế</span><input value={history.facility} maxLength={MAX_SHORT} onChange={(event) => setHistory((current) => ({ ...current, facility: event.target.value }))} /></label>
          <label><span>Nguồn</span><select value={history.sourceKind} onChange={(event) => setHistory((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn / tài liệu</span><input value={history.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setHistory((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        </div>
        <label className="cccp-wide"><span>Tóm tắt theo hồ sơ / thông tin đã biết</span><textarea value={history.summary} maxLength={MAX_LONG} onChange={(event) => setHistory((current) => ({ ...current, summary: event.target.value }))} /></label>
        <button type="button" className="hf-primary cccp-save" disabled={!history.title.trim() || !history.eventDate} onClick={() => void saveHistory()}>Mã hóa & lưu tiền sử</button>
      </div> : null}

      {mode === "care-plan" ? <div className="cccp-panel">
        <div className="cccp-panel-head"><div><span className="hf-kicker">Care plan</span><h4>Lưu kế hoạch đã được cung cấp</h4></div><span>Không tự tạo kế hoạch</span></div>
        <div className="cccp-grid">
          <label><span>Tên kế hoạch</span><input value={carePlan.title} maxLength={MAX_SHORT} onChange={(event) => setCarePlan((current) => ({ ...current, title: event.target.value }))} /></label>
          <label><span>Trạng thái</span><select value={carePlan.planStatus} onChange={(event) => setCarePlan((current) => ({ ...current, planStatus: event.target.value as CarePlanStatus }))}><option value="active">Đang áp dụng theo ghi nhận</option><option value="archived">Đã lưu trữ</option></select></label>
          <label><span>Nguồn</span><select value={carePlan.sourceKind} onChange={(event) => setCarePlan((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn / tài liệu</span><input value={carePlan.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setCarePlan((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        </div>
        <label className="cccp-wide"><span>Nội dung kế hoạch — chép từ nguồn</span><textarea value={carePlan.planText} maxLength={MAX_LONG} onChange={(event) => setCarePlan((current) => ({ ...current, planText: event.target.value }))} /></label>
        <label className="cccp-wide"><span>Hướng dẫn xử trí cá nhân đã được cung cấp</span><textarea value={carePlan.clinicianInstructions} maxLength={MAX_LONG} onChange={(event) => setCarePlan((current) => ({ ...current, clinicianInstructions: event.target.value }))} /></label>
        <label className="cccp-wide"><span>Hỗ trợ tại trường / sinh hoạt nếu có</span><textarea value={carePlan.schoolSupport} maxLength={MAX_LONG} onChange={(event) => setCarePlan((current) => ({ ...current, schoolSupport: event.target.value }))} /></label>
        <label className="cccp-wide"><span>Kế hoạch tái khám / theo dõi — chép từ nguồn</span><input value={carePlan.followUpText} maxLength={MAX_MEDIUM} onChange={(event) => setCarePlan((current) => ({ ...current, followUpText: event.target.value }))} /></label>
        <button type="button" className="hf-primary cccp-save" disabled={!carePlan.title.trim()} onClick={() => void saveCarePlan()}>Mã hóa & lưu kế hoạch</button>
      </div> : null}

      <div className="cccp-records" aria-live="polite">
        <div className="cccp-records-head"><strong>Bản ghi trong mục đang xem</strong><span>{loading ? "Đang giải mã…" : mode === "condition" ? `${conditions.length} mục` : mode === "history" ? `${historyEvents.length} mục` : `${carePlans.length} mục`}</span></div>
        {!loading && mode === "condition" ? conditions.map((record) => <article key={record.recordId}><div><small>{record.data.conditionStatus === "active" ? "Đang theo dõi" : record.data.conditionStatus === "inactive" ? "Không còn hoạt động" : "Đã được ghi là đã giải quyết"}</small><strong>{record.data.name}</strong><p>{record.data.specialty || record.data.clinicianOrFacility ? [record.data.specialty, record.data.clinicianOrFacility].filter(Boolean).join(" · ") : "Không ghi chuyên khoa/cơ sở"}</p><span>{record.data.knownSince ? `Biết từ ${formatDate(record.data.knownSince)} · ` : ""}{sourceLabels[record.data.sourceKind]}</span></div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
        {!loading && mode === "history" ? historyEvents.map((record) => <article key={record.recordId}><div><small>{eventLabels[record.data.eventType]}</small><strong>{record.data.title}</strong><p>{formatDate(record.data.eventDate)}{record.data.facility ? ` · ${record.data.facility}` : ""}</p><span>{sourceLabels[record.data.sourceKind]}</span></div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
        {!loading && mode === "care-plan" ? carePlans.map((record) => <article key={record.recordId}><div><small>{record.data.planStatus === "active" ? "Đang áp dụng theo ghi nhận" : "Đã lưu trữ"}</small><strong>{record.data.title}</strong><p>{record.data.followUpText || "Không ghi kế hoạch tái khám"}</p><span>{sourceLabels[record.data.sourceKind]}</span></div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
      </div>
    </> : null}

    {notice ? <div className="cccp-notice" role="status">{notice}</div> : null}
    <p className="cccp-footnote">Dữ liệu đi cùng bản sao Secure Vault đã mã hóa; không vào baseline JSON backup, Health Timeline hay Site Quản trị. Hướng dẫn xử trí chỉ là nội dung được chép từ nguồn, không phải hướng dẫn mới do ứng dụng tạo.</p>
  </section>;
}

export const CHRONIC_CONDITIONS_CARE_PLANS_V1_GUARDRAILS = {
  requiresConfiguredPrivacyScope: true,
  requiresViewerPermission: true,
  requiresUnlockedVault: true,
  vaultOnlyPersistence: true,
  encryptedBackupIncluded: true,
  noBaselineTimelineOrAdminFlow: true,
  noGeneratedDiagnosis: true,
  noGeneratedTreatmentPlan: true,
  noGeneratedEmergencyInstructions: true,
  provenanceRequiredBySchema: true,
} as const;
