"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";

export const VITAL_SIGNS_SCREENING_DOMAIN_ID = "vital-signs-screening-results";
export const VITAL_RECORD_KIND = "vital-sign-v1";
export const SENSORY_SCREEN_RECORD_KIND = "sensory-screen-v1";
export const SCREENING_RESULT_RECORD_KIND = "screening-result-v1";

const MAX_SHORT = 120;
const MAX_MEDIUM = 400;
const MAX_LONG = 1_000;

type SourceKind = "home-device" | "clinic" | "school-screening" | "lab-report" | "caregiver" | "other";
type VitalType = "blood-pressure" | "heart-rate" | "temperature" | "spo2" | "respiratory-rate" | "other";
type SensoryModality = "vision" | "hearing";

type VitalData = {
  kind: typeof VITAL_RECORD_KIND;
  vitalType: VitalType;
  observedDate: string;
  observedTime: string;
  primaryValue: string;
  secondaryValue: string;
  customLabel: string;
  unit: string;
  method: string;
  sourceKind: SourceKind;
  sourceNote: string;
  notes: string;
};

type SensoryScreenData = {
  kind: typeof SENSORY_SCREEN_RECORD_KIND;
  modality: SensoryModality;
  observedDate: string;
  leftResult: string;
  rightResult: string;
  method: string;
  contextText: string;
  sourceKind: SourceKind;
  sourceNote: string;
  notes: string;
};

type ScreeningResultData = {
  kind: typeof SCREENING_RESULT_RECORD_KIND;
  testName: string;
  observedDate: string;
  resultText: string;
  unitText: string;
  referenceText: string;
  method: string;
  sourceKind: SourceKind;
  sourceNote: string;
  notes: string;
};

type VitalEnvelope = VaultPayloadEnvelope<VitalData>;
type SensoryEnvelope = VaultPayloadEnvelope<SensoryScreenData>;
type ScreeningEnvelope = VaultPayloadEnvelope<ScreeningResultData>;
type ModuleRecord = VitalEnvelope | SensoryEnvelope | ScreeningEnvelope;

type VitalDraft = Omit<VitalData, "kind">;
type SensoryDraft = Omit<SensoryScreenData, "kind">;
type ScreeningDraft = Omit<ScreeningResultData, "kind">;

const sourceLabels: Record<SourceKind, string> = {
  "home-device": "Thiết bị đo tại nhà",
  clinic: "Cơ sở y tế / nhân viên y tế",
  "school-screening": "Khám / sàng lọc tại trường",
  "lab-report": "Phiếu xét nghiệm / kết quả kiểm tra",
  caregiver: "Người chăm sóc nhập lại dữ liệu đã có",
  other: "Nguồn khác",
};

const vitalLabels: Record<VitalType, string> = {
  "blood-pressure": "Huyết áp",
  "heart-rate": "Nhịp tim",
  temperature: "Nhiệt độ cơ thể",
  spo2: "SpO₂",
  "respiratory-rate": "Nhịp thở",
  other: "Chỉ số khác",
};

function defaultUnit(type: VitalType) {
  if (type === "blood-pressure") return "mmHg";
  if (type === "heart-rate") return "bpm";
  if (type === "temperature") return "°C";
  if (type === "spo2") return "%";
  if (type === "respiratory-rate") return "lần/phút";
  return "";
}

function todayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function emptyVital(): VitalDraft {
  return {
    vitalType: "blood-pressure",
    observedDate: todayDate(),
    observedTime: "",
    primaryValue: "",
    secondaryValue: "",
    customLabel: "",
    unit: "mmHg",
    method: "",
    sourceKind: "home-device",
    sourceNote: "",
    notes: "",
  };
}

function emptySensory(): SensoryDraft {
  return {
    modality: "vision",
    observedDate: todayDate(),
    leftResult: "",
    rightResult: "",
    method: "",
    contextText: "",
    sourceKind: "school-screening",
    sourceNote: "",
    notes: "",
  };
}

function emptyScreening(): ScreeningDraft {
  return {
    testName: "",
    observedDate: todayDate(),
    resultText: "",
    unitText: "",
    referenceText: "",
    method: "",
    sourceKind: "lab-report",
    sourceNote: "",
    notes: "",
  };
}

function validSource(value: unknown): value is SourceKind {
  return value === "home-device" || value === "clinic" || value === "school-screening" || value === "lab-report" || value === "caregiver" || value === "other";
}

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTime(value: unknown) {
  return typeof value === "string" && (value === "" || /^\d{2}:\d{2}$/.test(value));
}

function isVital(record: VaultPayloadEnvelope<unknown>): record is VitalEnvelope {
  if (record.domainId !== VITAL_SIGNS_SCREENING_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<VitalData>;
  return data.kind === VITAL_RECORD_KIND
    && (data.vitalType === "blood-pressure" || data.vitalType === "heart-rate" || data.vitalType === "temperature" || data.vitalType === "spo2" || data.vitalType === "respiratory-rate" || data.vitalType === "other")
    && validDate(data.observedDate)
    && validTime(data.observedTime)
    && typeof data.primaryValue === "string"
    && typeof data.secondaryValue === "string"
    && typeof data.customLabel === "string"
    && typeof data.unit === "string"
    && typeof data.method === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.notes === "string";
}

function isSensory(record: VaultPayloadEnvelope<unknown>): record is SensoryEnvelope {
  if (record.domainId !== VITAL_SIGNS_SCREENING_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<SensoryScreenData>;
  return data.kind === SENSORY_SCREEN_RECORD_KIND
    && (data.modality === "vision" || data.modality === "hearing")
    && validDate(data.observedDate)
    && typeof data.leftResult === "string"
    && typeof data.rightResult === "string"
    && typeof data.method === "string"
    && typeof data.contextText === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.notes === "string";
}

function isScreening(record: VaultPayloadEnvelope<unknown>): record is ScreeningEnvelope {
  if (record.domainId !== VITAL_SIGNS_SCREENING_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<ScreeningResultData>;
  return data.kind === SCREENING_RESULT_RECORD_KIND
    && typeof data.testName === "string"
    && validDate(data.observedDate)
    && typeof data.resultText === "string"
    && typeof data.unitText === "string"
    && typeof data.referenceText === "string"
    && typeof data.method === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.notes === "string";
}

function clean(value: string, max = MAX_MEDIUM) {
  return value.trim().slice(0, max);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function VitalSignsScreening() {
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
  } = useSensitiveVaultDomain(VITAL_SIGNS_SCREENING_DOMAIN_ID);
  const [mode, setMode] = useState<"vitals" | "sensory" | "screening">("vitals");
  const [vital, setVital] = useState<VitalDraft>(() => emptyVital());
  const [sensory, setSensory] = useState<SensoryDraft>(() => emptySensory());
  const [screening, setScreening] = useState<ScreeningDraft>(() => emptyScreening());
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const vitalRecords = useMemo(() => records.filter((record): record is VitalEnvelope => isVital(record)), [records]);
  const sensoryRecords = useMemo(() => records.filter((record): record is SensoryEnvelope => isSensory(record)), [records]);
  const screeningRecords = useMemo(() => records.filter((record): record is ScreeningEnvelope => isScreening(record)), [records]);

  const loadRecords = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const vaultRecords = await listVaultRecords(key, profileId);
      setRecords(vaultRecords.filter((record): record is ModuleRecord => isVital(record) || isSensory(record) || isScreening(record)));
    } catch (error) {
      setRecords([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc dữ liệu dấu hiệu sinh tồn và sàng lọc.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  function changeVitalType(type: VitalType) {
    setVital((current) => ({
      ...current,
      vitalType: type,
      primaryValue: "",
      secondaryValue: "",
      customLabel: type === "other" ? current.customLabel : "",
      unit: defaultUnit(type),
    }));
  }

  async function saveVital() {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    const first = clean(vital.primaryValue, 40);
    const second = clean(vital.secondaryValue, 40);
    const customLabel = clean(vital.customLabel, MAX_SHORT);
    if (!vital.observedDate || !first) {
      setNotice("Cần có ngày đo và giá trị được ghi nhận.");
      return;
    }
    if (vital.vitalType === "blood-pressure" && !second) {
      setNotice("Bản ghi huyết áp cần đủ hai giá trị đã được đo.");
      return;
    }
    if (vital.vitalType === "other" && (!customLabel || !clean(vital.unit, 40))) {
      setNotice("Chỉ số khác cần có tên chỉ số và đơn vị đúng như nguồn đo.");
      return;
    }
    const now = new Date().toISOString();
    const payload: VitalEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: VITAL_SIGNS_SCREENING_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: VITAL_RECORD_KIND,
        vitalType: vital.vitalType,
        observedDate: vital.observedDate,
        observedTime: vital.observedTime,
        primaryValue: first,
        secondaryValue: second,
        customLabel,
        unit: clean(vital.unit, 40),
        method: clean(vital.method),
        sourceKind: vital.sourceKind,
        sourceNote: clean(vital.sourceNote, MAX_SHORT * 2),
        notes: clean(vital.notes, MAX_LONG),
      },
    };
    setNotice("");
    try {
      await putVaultRecord(key, payload);
      setVital(emptyVital());
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu số đo. Ứng dụng chỉ lưu giá trị, không tự phân loại bình thường/bất thường.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu số đo.");
    }
  }

  async function saveSensory() {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    const leftResult = clean(sensory.leftResult);
    const rightResult = clean(sensory.rightResult);
    if (!sensory.observedDate || (!leftResult && !rightResult)) {
      setNotice("Cần có ngày kiểm tra và ít nhất một kết quả bên trái/phải được ghi lại.");
      return;
    }
    const now = new Date().toISOString();
    const payload: SensoryEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: VITAL_SIGNS_SCREENING_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: SENSORY_SCREEN_RECORD_KIND,
        modality: sensory.modality,
        observedDate: sensory.observedDate,
        leftResult,
        rightResult,
        method: clean(sensory.method),
        contextText: clean(sensory.contextText),
        sourceKind: sensory.sourceKind,
        sourceNote: clean(sensory.sourceNote, MAX_SHORT * 2),
        notes: clean(sensory.notes, MAX_LONG),
      },
    };
    setNotice("");
    try {
      await putVaultRecord(key, payload);
      setSensory(emptySensory());
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu kết quả mắt/tai đúng theo thông tin được nhập.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu kết quả mắt/tai.");
    }
  }

  async function saveScreening() {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    const testName = clean(screening.testName, MAX_SHORT);
    const resultText = clean(screening.resultText);
    if (!screening.observedDate || !testName || !resultText) {
      setNotice("Kết quả sàng lọc/xét nghiệm cần có tên, ngày và kết quả được chép từ nguồn.");
      return;
    }
    const now = new Date().toISOString();
    const payload: ScreeningEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: VITAL_SIGNS_SCREENING_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: SCREENING_RESULT_RECORD_KIND,
        testName,
        observedDate: screening.observedDate,
        resultText,
        unitText: clean(screening.unitText, MAX_SHORT),
        referenceText: clean(screening.referenceText),
        method: clean(screening.method),
        sourceKind: screening.sourceKind,
        sourceNote: clean(screening.sourceNote, MAX_SHORT * 2),
        notes: clean(screening.notes, MAX_LONG),
      },
    };
    setNotice("");
    try {
      await putVaultRecord(key, payload);
      setScreening(emptyScreening());
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu kết quả. Khoảng tham chiếu chỉ được lưu như văn bản nguồn; ứng dụng không tự so sánh hay diễn giải.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu kết quả sàng lọc/xét nghiệm.");
    }
  }

  async function removeRecord(record: ModuleRecord) {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    if (!window.confirm("Xóa vĩnh viễn bản ghi này khỏi Secure Vault?")) return;
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

  return <section className="vss" aria-label="Dấu hiệu sinh tồn và kết quả sàng lọc mã hóa">
    <header className="vss-head">
      <div>
        <span className="hf-kicker">Vital Signs & Screening Results V1 · Secure Vault</span>
        <h3>Dấu hiệu sinh tồn, mắt/tai & kết quả kiểm tra</h3>
        <p>Lưu lại số đo và kết quả đúng theo nguồn. V1 không tự suy diễn bất thường, không chẩn đoán và không dùng khoảng tham chiếu để tự đưa ra kết luận.</p>
      </div>
      <div className="vss-state"><strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong><span>{HEALTH_VIEWER_ROLE_LABELS[role]}</span></div>
    </header>

    {!privacyReady ? <div className="vss-lock">Đang đọc quyền riêng tư của hồ sơ…</div> : null}
    {privacyReady && visibility === "unconfigured" ? <div className="vss-lock is-warning"><strong>Khóa mặc định.</strong><span>Hãy cấu hình miền “Dấu hiệu sinh tồn, sàng lọc & kết quả kiểm tra” trong Profile Privacy trước.</span></div> : null}
    {privacyReady && visibility !== "unconfigured" && !privacyAllowed ? <div className="vss-lock"><strong>Ẩn với chế độ người đang xem hiện tại.</strong><span>Không tải hoặc giải mã dữ liệu khi policy không cho phép.</span></div> : null}
    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className="vss-lock"><strong>{status === "unsupported" ? "Trình duyệt không hỗ trợ Secure Vault." : "Cần mở Secure Vault."}</strong><span>Không có plaintext fallback vào hồ sơ thường, Timeline hoặc Site Quản trị.</span></div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className="vss-switch" role="group" aria-label="Loại kết quả">
        <button type="button" className={mode === "vitals" ? "is-selected" : ""} aria-pressed={mode === "vitals"} onClick={() => setMode("vitals")}><strong>Dấu hiệu sinh tồn</strong><small>{vitalRecords.length} bản ghi</small></button>
        <button type="button" className={mode === "sensory" ? "is-selected" : ""} aria-pressed={mode === "sensory"} onClick={() => setMode("sensory")}><strong>Mắt / tai</strong><small>{sensoryRecords.length} bản ghi</small></button>
        <button type="button" className={mode === "screening" ? "is-selected" : ""} aria-pressed={mode === "screening"} onClick={() => setMode("screening")}><strong>Sàng lọc / xét nghiệm</strong><small>{screeningRecords.length} bản ghi</small></button>
      </div>

      {mode === "vitals" ? <div className="vss-panel">
        <div className="vss-panel-head"><div><span className="hf-kicker">Số đo</span><h4>Ghi đúng giá trị hiển thị từ nguồn đo</h4></div><span>Không tự đánh giá</span></div>
        <div className="vss-grid">
          <label><span>Loại chỉ số</span><select value={vital.vitalType} onChange={(event) => changeVitalType(event.target.value as VitalType)}>{Object.entries(vitalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {vital.vitalType === "other" ? <label><span>Tên chỉ số</span><input value={vital.customLabel} maxLength={MAX_SHORT} onChange={(event) => setVital((current) => ({ ...current, customLabel: event.target.value }))} /></label> : null}
          <label><span>Ngày đo</span><input type="date" value={vital.observedDate} onChange={(event) => setVital((current) => ({ ...current, observedDate: event.target.value }))} /></label>
          <label><span>Giờ đo nếu biết</span><input type="time" value={vital.observedTime} onChange={(event) => setVital((current) => ({ ...current, observedTime: event.target.value }))} /></label>
          <label><span>{vital.vitalType === "blood-pressure" ? "Tâm thu — chép số đo" : "Giá trị — chép số đo"}</span><input inputMode="decimal" value={vital.primaryValue} maxLength={40} onChange={(event) => setVital((current) => ({ ...current, primaryValue: event.target.value }))} /></label>
          {vital.vitalType === "blood-pressure" ? <label><span>Tâm trương — chép số đo</span><input inputMode="decimal" value={vital.secondaryValue} maxLength={40} onChange={(event) => setVital((current) => ({ ...current, secondaryValue: event.target.value }))} /></label> : null}
          <label><span>Đơn vị</span><input value={vital.unit} maxLength={40} readOnly={vital.vitalType !== "other"} onChange={(event) => setVital((current) => ({ ...current, unit: event.target.value }))} /></label>
          <label><span>Thiết bị / cách đo nếu muốn</span><input value={vital.method} maxLength={MAX_MEDIUM} onChange={(event) => setVital((current) => ({ ...current, method: event.target.value }))} /></label>
          <label><span>Nguồn thông tin</span><select value={vital.sourceKind} onChange={(event) => setVital((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn</span><input value={vital.sourceNote} maxLength={MAX_SHORT * 2} onChange={(event) => setVital((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        </div>
        <label className="vss-wide"><span>Ghi chú</span><textarea value={vital.notes} maxLength={MAX_LONG} onChange={(event) => setVital((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button type="button" className="hf-primary vss-save" onClick={() => void saveVital()}>Mã hóa & lưu số đo</button>
      </div> : null}

      {mode === "sensory" ? <div className="vss-panel">
        <div className="vss-panel-head"><div><span className="hf-kicker">Mắt / tai</span><h4>Chép lại kết quả đã đo hoặc sàng lọc</h4></div><span>Không tự gắn nhãn</span></div>
        <div className="vss-grid">
          <label><span>Loại kiểm tra</span><select value={sensory.modality} onChange={(event) => setSensory((current) => ({ ...current, modality: event.target.value as SensoryModality }))}><option value="vision">Thị lực / mắt</option><option value="hearing">Thính lực / tai</option></select></label>
          <label><span>Ngày kiểm tra</span><input type="date" value={sensory.observedDate} onChange={(event) => setSensory((current) => ({ ...current, observedDate: event.target.value }))} /></label>
          <label><span>Kết quả bên trái — chép từ nguồn</span><input value={sensory.leftResult} maxLength={MAX_MEDIUM} onChange={(event) => setSensory((current) => ({ ...current, leftResult: event.target.value }))} /></label>
          <label><span>Kết quả bên phải — chép từ nguồn</span><input value={sensory.rightResult} maxLength={MAX_MEDIUM} onChange={(event) => setSensory((current) => ({ ...current, rightResult: event.target.value }))} /></label>
          <label><span>Phương pháp / dụng cụ nếu biết</span><input value={sensory.method} maxLength={MAX_MEDIUM} onChange={(event) => setSensory((current) => ({ ...current, method: event.target.value }))} /></label>
          <label><span>Bối cảnh khi đo</span><input value={sensory.contextText} maxLength={MAX_MEDIUM} onChange={(event) => setSensory((current) => ({ ...current, contextText: event.target.value }))} placeholder="Ví dụ: có đeo kính khi đo — chỉ nhập nếu biết" /></label>
          <label><span>Nguồn thông tin</span><select value={sensory.sourceKind} onChange={(event) => setSensory((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn</span><input value={sensory.sourceNote} maxLength={MAX_SHORT * 2} onChange={(event) => setSensory((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        </div>
        <label className="vss-wide"><span>Ghi chú</span><textarea value={sensory.notes} maxLength={MAX_LONG} onChange={(event) => setSensory((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button type="button" className="hf-primary vss-save" onClick={() => void saveSensory()}>Mã hóa & lưu kết quả mắt/tai</button>
      </div> : null}

      {mode === "screening" ? <div className="vss-panel">
        <div className="vss-panel-head"><div><span className="hf-kicker">Sàng lọc / xét nghiệm</span><h4>Nhập nguyên dữ liệu có trên phiếu hoặc kết quả</h4></div><span>Không so sánh range</span></div>
        <div className="vss-grid">
          <label><span>Tên xét nghiệm / kiểm tra</span><input value={screening.testName} maxLength={MAX_SHORT} onChange={(event) => setScreening((current) => ({ ...current, testName: event.target.value }))} /></label>
          <label><span>Ngày kết quả / ngày lấy mẫu</span><input type="date" value={screening.observedDate} onChange={(event) => setScreening((current) => ({ ...current, observedDate: event.target.value }))} /></label>
          <label><span>Kết quả — chép từ nguồn</span><input value={screening.resultText} maxLength={MAX_MEDIUM} onChange={(event) => setScreening((current) => ({ ...current, resultText: event.target.value }))} /></label>
          <label><span>Đơn vị ghi trên nguồn</span><input value={screening.unitText} maxLength={MAX_SHORT} onChange={(event) => setScreening((current) => ({ ...current, unitText: event.target.value }))} /></label>
          <label><span>Khoảng tham chiếu ghi trên nguồn</span><input value={screening.referenceText} maxLength={MAX_MEDIUM} onChange={(event) => setScreening((current) => ({ ...current, referenceText: event.target.value }))} placeholder="Chỉ chép lại; ứng dụng không tự đối chiếu" /></label>
          <label><span>Phương pháp / loại mẫu nếu biết</span><input value={screening.method} maxLength={MAX_MEDIUM} onChange={(event) => setScreening((current) => ({ ...current, method: event.target.value }))} /></label>
          <label><span>Nguồn thông tin</span><select value={screening.sourceKind} onChange={(event) => setScreening((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ghi nguồn</span><input value={screening.sourceNote} maxLength={MAX_SHORT * 2} onChange={(event) => setScreening((current) => ({ ...current, sourceNote: event.target.value }))} /></label>
        </div>
        <label className="vss-wide"><span>Ghi chú</span><textarea value={screening.notes} maxLength={MAX_LONG} onChange={(event) => setScreening((current) => ({ ...current, notes: event.target.value }))} /></label>
        <button type="button" className="hf-primary vss-save" onClick={() => void saveScreening()}>Mã hóa & lưu kết quả</button>
      </div> : null}

      <div className="vss-list" aria-live="polite">
        <div className="vss-list-head"><strong>Bản ghi trong nhóm đang chọn</strong><span>{loading ? "Đang giải mã…" : mode === "vitals" ? `${vitalRecords.length} mục` : mode === "sensory" ? `${sensoryRecords.length} mục` : `${screeningRecords.length} mục`}</span></div>
        {!loading && mode === "vitals" && vitalRecords.length === 0 ? <div className="vss-empty">Chưa có số đo dấu hiệu sinh tồn.</div> : null}
        {!loading && mode === "sensory" && sensoryRecords.length === 0 ? <div className="vss-empty">Chưa có kết quả mắt/tai.</div> : null}
        {!loading && mode === "screening" && screeningRecords.length === 0 ? <div className="vss-empty">Chưa có kết quả sàng lọc/xét nghiệm.</div> : null}
        {mode === "vitals" ? vitalRecords.map((record) => <article key={record.recordId}><div><small>{formatDate(record.data.observedDate)}{record.data.observedTime ? ` · ${record.data.observedTime}` : ""} · {sourceLabels[record.data.sourceKind]}</small><strong>{record.data.vitalType === "other" ? record.data.customLabel : vitalLabels[record.data.vitalType]}</strong><p>{record.data.vitalType === "blood-pressure" ? `${record.data.primaryValue}/${record.data.secondaryValue} ${record.data.unit}` : `${record.data.primaryValue} ${record.data.unit}`}</p>{record.data.method ? <span>{record.data.method}</span> : null}{record.data.sourceNote ? <span>{record.data.sourceNote}</span> : null}</div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
        {mode === "sensory" ? sensoryRecords.map((record) => <article key={record.recordId}><div><small>{formatDate(record.data.observedDate)} · {sourceLabels[record.data.sourceKind]}</small><strong>{record.data.modality === "vision" ? "Thị lực / mắt" : "Thính lực / tai"}</strong><p>Trái: {record.data.leftResult || "—"} · Phải: {record.data.rightResult || "—"}</p>{record.data.method ? <span>{record.data.method}</span> : null}{record.data.contextText ? <span>{record.data.contextText}</span> : null}</div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
        {mode === "screening" ? screeningRecords.map((record) => <article key={record.recordId}><div><small>{formatDate(record.data.observedDate)} · {sourceLabels[record.data.sourceKind]}</small><strong>{record.data.testName}</strong><p>{record.data.resultText}{record.data.unitText ? ` ${record.data.unitText}` : ""}</p>{record.data.referenceText ? <span>Tham chiếu trên nguồn: {record.data.referenceText}</span> : null}{record.data.sourceNote ? <span>{record.data.sourceNote}</span> : null}</div><button type="button" onClick={() => void removeRecord(record)}>Xóa</button></article>) : null}
      </div>
    </> : null}

    {notice ? <div className="vss-notice" role="status">{notice}</div> : null}
    <p className="vss-footnote">Mọi record của module này chỉ được giải mã khi Profile Privacy cho phép và Secure Vault của đúng hồ sơ đang mở. Record được đi cùng bản sao Secure Vault đã mã hóa, không đi vào bản sao baseline, Health Timeline hay Site Quản trị. Cập nhật giao diện gần nhất: {formatDateTime(new Date().toISOString())}.</p>
  </section>;
}

export const VITAL_SIGNS_SCREENING_V1_GUARDRAILS = {
  highlySensitiveDomain: true,
  requiresConfiguredPrivacyScope: true,
  requiresViewerPermission: true,
  requiresUnlockedVault: true,
  encryptedOnlyPersistence: true,
  provenanceRequiredByDesign: true,
  noAutomaticRangeComparison: true,
  noAutomaticNormalAbnormalClassification: true,
  noDiagnosisOrTreatmentRecommendation: true,
  noAdminOrNetworkFlow: true,
  excludedFromBaselineTimelineAndBackup: true,
} as const;
