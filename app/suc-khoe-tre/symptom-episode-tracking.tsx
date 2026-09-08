"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";

export const SYMPTOM_EPISODE_DOMAIN_ID = "symptoms-illness-first-aid";
export const SYMPTOM_EPISODE_RECORD_KIND = "symptom-illness-episode-v1";
export const SYMPTOM_EPISODE_UPDATE_KIND = "symptom-episode-update-v1";

const MAX_SHORT = 140;
const MAX_MEDIUM = 420;
const MAX_LONG = 1_600;

type SourceKind = "self" | "caregiver" | "clinician" | "medical-document" | "other";
type EpisodeStatus = "active" | "improving" | "resolved" | "unknown";
type SeverityText = "mild" | "moderate" | "severe" | "not-specified";

type EpisodeData = {
  kind: typeof SYMPTOM_EPISODE_RECORD_KIND;
  title: string;
  onsetDate: string;
  onsetTime: string;
  status: EpisodeStatus;
  severity: SeverityText;
  symptoms: string[];
  context: string;
  measuredTemperature: string;
  temperatureUnit: "C" | "F" | "";
  careSought: string;
  sourceKind: SourceKind;
  sourceNote: string;
  resolvedDate: string;
  summary: string;
};

type EpisodeUpdateData = {
  kind: typeof SYMPTOM_EPISODE_UPDATE_KIND;
  episodeRecordId: string;
  observedDate: string;
  observedTime: string;
  status: EpisodeStatus;
  severity: SeverityText;
  symptoms: string[];
  note: string;
  measuredTemperature: string;
  temperatureUnit: "C" | "F" | "";
  careSought: string;
  sourceKind: SourceKind;
  sourceNote: string;
};

type EpisodeEnvelope = VaultPayloadEnvelope<EpisodeData>;
type UpdateEnvelope = VaultPayloadEnvelope<EpisodeUpdateData>;
type ModuleRecord = EpisodeEnvelope | UpdateEnvelope;

const sourceLabels: Record<SourceKind, string> = {
  self: "Người được theo dõi tự ghi",
  caregiver: "Người chăm sóc ghi",
  clinician: "Bác sĩ / nhân viên y tế",
  "medical-document": "Hồ sơ / giấy tờ y tế",
  other: "Nguồn khác",
};

const statusLabels: Record<EpisodeStatus, string> = {
  active: "Đang diễn ra",
  improving: "Đang cải thiện",
  resolved: "Đã kết thúc",
  unknown: "Chưa rõ",
};

const severityLabels: Record<SeverityText, string> = {
  mild: "Nhẹ theo mô tả người ghi",
  moderate: "Vừa theo mô tả người ghi",
  severe: "Nặng theo mô tả người ghi",
  "not-specified": "Không ghi mức độ",
};

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validSource(value: unknown): value is SourceKind {
  return value === "self" || value === "caregiver" || value === "clinician" || value === "medical-document" || value === "other";
}

function validStatus(value: unknown): value is EpisodeStatus {
  return value === "active" || value === "improving" || value === "resolved" || value === "unknown";
}

function validSeverity(value: unknown): value is SeverityText {
  return value === "mild" || value === "moderate" || value === "severe" || value === "not-specified";
}

function isEpisode(record: VaultPayloadEnvelope<unknown>): record is EpisodeEnvelope {
  if (record.domainId !== SYMPTOM_EPISODE_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<EpisodeData>;
  return data.kind === SYMPTOM_EPISODE_RECORD_KIND
    && typeof data.title === "string"
    && validDate(data.onsetDate)
    && typeof data.onsetTime === "string"
    && validStatus(data.status)
    && validSeverity(data.severity)
    && Array.isArray(data.symptoms)
    && typeof data.context === "string"
    && typeof data.measuredTemperature === "string"
    && (data.temperatureUnit === "C" || data.temperatureUnit === "F" || data.temperatureUnit === "")
    && typeof data.careSought === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string"
    && typeof data.resolvedDate === "string"
    && typeof data.summary === "string";
}

function isUpdate(record: VaultPayloadEnvelope<unknown>): record is UpdateEnvelope {
  if (record.domainId !== SYMPTOM_EPISODE_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<EpisodeUpdateData>;
  return data.kind === SYMPTOM_EPISODE_UPDATE_KIND
    && typeof data.episodeRecordId === "string"
    && validDate(data.observedDate)
    && typeof data.observedTime === "string"
    && validStatus(data.status)
    && validSeverity(data.severity)
    && Array.isArray(data.symptoms)
    && typeof data.note === "string"
    && typeof data.measuredTemperature === "string"
    && (data.temperatureUnit === "C" || data.temperatureUnit === "F" || data.temperatureUnit === "")
    && typeof data.careSought === "string"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string";
}

function clip(value: string, max = MAX_MEDIUM) {
  return value.trim().slice(0, max);
}

function parseSymptoms(value: string) {
  return [...new Set(value.split(/[,;\n]/).map((item) => item.trim().slice(0, 80)).filter(Boolean))].slice(0, 24);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function chronologyValue(date: string, time: string) {
  return `${date}T${/^\d{2}:\d{2}$/.test(time) ? time : "00:00"}`;
}

export default function SymptomEpisodeTracking() {
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
  } = useSensitiveVaultDomain(SYMPTOM_EPISODE_DOMAIN_ID);

  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [episode, setEpisode] = useState({ title: "", onsetDate: "", onsetTime: "", status: "active" as EpisodeStatus, severity: "not-specified" as SeverityText, symptomsText: "", context: "", measuredTemperature: "", temperatureUnit: "C" as "C" | "F" | "", careSought: "", sourceKind: "caregiver" as SourceKind, sourceNote: "", resolvedDate: "", summary: "" });
  const [update, setUpdate] = useState({ observedDate: "", observedTime: "", status: "active" as EpisodeStatus, severity: "not-specified" as SeverityText, symptomsText: "", note: "", measuredTemperature: "", temperatureUnit: "C" as "C" | "F" | "", careSought: "", sourceKind: "caregiver" as SourceKind, sourceNote: "" });

  const episodes = useMemo(() => records.filter((record): record is EpisodeEnvelope => isEpisode(record)).sort((a, b) => chronologyValue(b.data.onsetDate, b.data.onsetTime).localeCompare(chronologyValue(a.data.onsetDate, a.data.onsetTime))), [records]);
  const updates = useMemo(() => records.filter((record): record is UpdateEnvelope => isUpdate(record)), [records]);
  const selectedEpisode = episodes.find((item) => item.recordId === selectedEpisodeId) ?? null;
  const selectedUpdates = useMemo(() => updates.filter((item) => item.data.episodeRecordId === selectedEpisodeId).sort((a, b) => chronologyValue(b.data.observedDate, b.data.observedTime).localeCompare(chronologyValue(a.data.observedDate, a.data.observedTime))), [selectedEpisodeId, updates]);

  const loadRecords = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const vaultRecords = await listVaultRecords(key, profileId);
      setRecords(vaultRecords.filter((record): record is ModuleRecord => isEpisode(record) || isUpdate(record)));
    } catch (error) {
      setRecords([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc episode triệu chứng.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  async function saveEpisode() {
    const title = clip(episode.title, MAX_SHORT);
    if (!title || !episode.onsetDate || !privacyAllowed || status !== "unlocked" || !key) {
      setNotice("Episode cần có tên ngắn và ngày bắt đầu.");
      return;
    }
    if (episode.resolvedDate && episode.resolvedDate < episode.onsetDate) {
      setNotice("Ngày kết thúc không thể trước ngày bắt đầu.");
      return;
    }
    const now = new Date().toISOString();
    const payload: EpisodeEnvelope = { schemaVersion: 1, profileId, recordId: crypto.randomUUID(), domainId: SYMPTOM_EPISODE_DOMAIN_ID, createdAt: now, updatedAt: now, data: { kind: SYMPTOM_EPISODE_RECORD_KIND, title, onsetDate: episode.onsetDate, onsetTime: /^\d{2}:\d{2}$/.test(episode.onsetTime) ? episode.onsetTime : "", status: episode.status, severity: episode.severity, symptoms: parseSymptoms(episode.symptomsText), context: clip(episode.context, MAX_LONG), measuredTemperature: clip(episode.measuredTemperature, 40), temperatureUnit: episode.measuredTemperature ? episode.temperatureUnit : "", careSought: clip(episode.careSought, MAX_LONG), sourceKind: episode.sourceKind, sourceNote: clip(episode.sourceNote, MAX_MEDIUM), resolvedDate: episode.resolvedDate, summary: clip(episode.summary, MAX_LONG) } };
    try {
      await putVaultRecord(key, payload);
      setEpisode({ title: "", onsetDate: "", onsetTime: "", status: "active", severity: "not-specified", symptomsText: "", context: "", measuredTemperature: "", temperatureUnit: "C", careSought: "", sourceKind: "caregiver", sourceNote: "", resolvedDate: "", summary: "" });
      setSelectedEpisodeId(payload.recordId);
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và tạo episode. Ứng dụng không tự suy chẩn đoán hoặc mức nguy cơ từ nội dung đã nhập.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu episode.");
    }
  }

  async function saveUpdate() {
    if (!selectedEpisode || !update.observedDate || !privacyAllowed || status !== "unlocked" || !key) {
      setNotice("Chọn episode và nhập ngày diễn biến trước khi lưu.");
      return;
    }
    const now = new Date().toISOString();
    const payload: UpdateEnvelope = { schemaVersion: 1, profileId, recordId: crypto.randomUUID(), domainId: SYMPTOM_EPISODE_DOMAIN_ID, createdAt: now, updatedAt: now, data: { kind: SYMPTOM_EPISODE_UPDATE_KIND, episodeRecordId: selectedEpisode.recordId, observedDate: update.observedDate, observedTime: /^\d{2}:\d{2}$/.test(update.observedTime) ? update.observedTime : "", status: update.status, severity: update.severity, symptoms: parseSymptoms(update.symptomsText), note: clip(update.note, MAX_LONG), measuredTemperature: clip(update.measuredTemperature, 40), temperatureUnit: update.measuredTemperature ? update.temperatureUnit : "", careSought: clip(update.careSought, MAX_LONG), sourceKind: update.sourceKind, sourceNote: clip(update.sourceNote, MAX_MEDIUM) } };
    try {
      await putVaultRecord(key, payload);
      setUpdate({ observedDate: "", observedTime: "", status: selectedEpisode.data.status, severity: "not-specified", symptomsText: "", note: "", measuredTemperature: "", temperatureUnit: "C", careSought: "", sourceKind: "caregiver", sourceNote: "" });
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu diễn biến vào episode đã chọn.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu diễn biến.");
    }
  }

  async function removeRecord(record: ModuleRecord) {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    const message = isEpisode(record) ? "Xóa episode này? Các bản cập nhật liên quan sẽ không bị tự xóa để tránh mất dữ liệu ngoài ý muốn." : "Xóa vĩnh viễn bản cập nhật này khỏi Secure Vault?";
    if (!window.confirm(message)) return;
    try {
      await deleteVaultRecord(key, profileId, record.recordId);
      if (record.recordId === selectedEpisodeId) setSelectedEpisodeId("");
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã xóa bản ghi khỏi Secure Vault.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa bản ghi.");
    }
  }

  return <section className="set" aria-label="Episode triệu chứng và bệnh cấp mã hóa">
    <header className="set-head"><div><span className="hf-kicker">Symptoms, Illness & Episode Tracking V1 · Secure Vault</span><h3>Episode triệu chứng & diễn biến bệnh cấp</h3><p>Tạo một episode khi có một đợt triệu chứng, sau đó thêm diễn biến theo thời gian. Mức độ ở V1 chỉ là mô tả do người dùng nhập, không phải phân loại y khoa.</p></div><div className="set-state"><strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong><span>{HEALTH_VIEWER_ROLE_LABELS[role]}</span></div></header>
    {!privacyReady ? <div className="set-lock">Đang đọc quyền riêng tư của hồ sơ…</div> : null}
    {privacyReady && visibility === "unconfigured" ? <div className="set-lock is-warning"><strong>Chưa cấu hình quyền xem.</strong><span>Hãy cấu hình miền “Triệu chứng, bệnh cấp & sơ cứu” trong Profile Privacy trước khi mở dữ liệu episode.</span></div> : null}
    {privacyReady && visibility !== "unconfigured" && !privacyAllowed ? <div className="set-lock"><strong>Ẩn với người đang xem hiện tại.</strong><span>Module không tải hoặc giải mã dữ liệu khi policy không cho phép.</span></div> : null}
    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className="set-lock"><strong>{status === "unsupported" ? "Trình duyệt không hỗ trợ Secure Vault." : "Cần mở Secure Vault."}</strong><span>Episode không có plaintext fallback vào DailyRecord, Timeline hoặc Site Quản trị.</span></div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className="set-grid"><section className="set-panel"><div className="set-panel-head"><div><span className="hf-kicker">Episode mới</span><h4>Bắt đầu một đợt theo dõi</h4></div><span>{episodes.length} episode</span></div><div className="set-form-grid">
        <label><span>Tên ngắn</span><input value={episode.title} maxLength={MAX_SHORT} placeholder="Ví dụ: sốt và đau họng" onChange={(event) => setEpisode((current) => ({ ...current, title: event.target.value }))} /></label>
        <label><span>Ngày bắt đầu</span><input type="date" value={episode.onsetDate} onChange={(event) => setEpisode((current) => ({ ...current, onsetDate: event.target.value }))} /></label>
        <label><span>Giờ bắt đầu nếu biết</span><input type="time" value={episode.onsetTime} onChange={(event) => setEpisode((current) => ({ ...current, onsetTime: event.target.value }))} /></label>
        <label><span>Trạng thái hiện ghi nhận</span><select value={episode.status} onChange={(event) => setEpisode((current) => ({ ...current, status: event.target.value as EpisodeStatus }))}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Mức độ do người ghi mô tả</span><select value={episode.severity} onChange={(event) => setEpisode((current) => ({ ...current, severity: event.target.value as SeverityText }))}>{Object.entries(severityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Nhiệt độ nếu đã đo</span><div className="set-inline"><input inputMode="decimal" value={episode.measuredTemperature} maxLength={40} onChange={(event) => setEpisode((current) => ({ ...current, measuredTemperature: event.target.value }))} /><select aria-label="Đơn vị nhiệt độ" value={episode.temperatureUnit} onChange={(event) => setEpisode((current) => ({ ...current, temperatureUnit: event.target.value as "C" | "F" }))}><option value="C">°C</option><option value="F">°F</option></select></div></label>
        <label><span>Nguồn thông tin</span><select value={episode.sourceKind} onChange={(event) => setEpisode((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Ngày kết thúc nếu đã rõ</span><input type="date" min={episode.onsetDate || undefined} value={episode.resolvedDate} onChange={(event) => setEpisode((current) => ({ ...current, resolvedDate: event.target.value, status: event.target.value ? "resolved" : current.status }))} /></label>
      </div><label className="set-wide"><span>Triệu chứng — ngăn bằng dấu phẩy hoặc xuống dòng</span><textarea value={episode.symptomsText} maxLength={MAX_LONG} onChange={(event) => setEpisode((current) => ({ ...current, symptomsText: event.target.value }))} /></label><label className="set-wide"><span>Bối cảnh / điều xảy ra trước đó</span><textarea value={episode.context} maxLength={MAX_LONG} onChange={(event) => setEpisode((current) => ({ ...current, context: event.target.value }))} /></label><label className="set-wide"><span>Đã tìm chăm sóc / tư vấn nào</span><textarea value={episode.careSought} maxLength={MAX_LONG} onChange={(event) => setEpisode((current) => ({ ...current, careSought: event.target.value }))} /></label><label className="set-wide"><span>Ghi nguồn / tài liệu</span><textarea value={episode.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setEpisode((current) => ({ ...current, sourceNote: event.target.value }))} /></label><label className="set-wide"><span>Tóm tắt episode</span><textarea value={episode.summary} maxLength={MAX_LONG} onChange={(event) => setEpisode((current) => ({ ...current, summary: event.target.value }))} /></label><button type="button" className="hf-primary set-save" onClick={() => void saveEpisode()}>Mã hóa & tạo episode</button></section>

        <section className="set-panel"><div className="set-panel-head"><div><span className="hf-kicker">Episode hiện có</span><h4>Chọn để xem diễn biến</h4></div><span>{loading ? "Đang đọc…" : `${episodes.length} mục`}</span></div>{episodes.length ? <div className="set-episode-list">{episodes.map((item) => <article key={item.recordId} className={selectedEpisodeId === item.recordId ? "is-selected" : ""}><button type="button" className="set-episode-select" aria-pressed={selectedEpisodeId === item.recordId} onClick={() => { setSelectedEpisodeId(item.recordId); setUpdate((current) => ({ ...current, status: item.data.status })); }}><span>{formatDate(item.data.onsetDate)}{item.data.onsetTime ? ` · ${item.data.onsetTime}` : ""}</span><strong>{item.data.title}</strong><small>{statusLabels[item.data.status]} · {severityLabels[item.data.severity]}</small><small>{item.data.symptoms.length ? item.data.symptoms.join(" · ") : "Chưa liệt kê triệu chứng"}</small></button><button type="button" className="set-delete" onClick={() => void removeRecord(item)}>Xóa</button></article>)}</div> : <p className="hf-muted">Chưa có episode. Các chip triệu chứng theo ngày cũ vẫn được giữ nguyên và không tự ghép thành episode để tránh suy diễn sai thời điểm khởi phát/kết thúc.</p>}</section></div>

      {selectedEpisode ? <section className="set-panel set-update-panel"><div className="set-panel-head"><div><span className="hf-kicker">Diễn biến</span><h4>{selectedEpisode.data.title}</h4></div><span>{selectedUpdates.length} cập nhật</span></div><div className="set-form-grid">
        <label><span>Ngày ghi nhận</span><input type="date" min={selectedEpisode.data.onsetDate} value={update.observedDate} onChange={(event) => setUpdate((current) => ({ ...current, observedDate: event.target.value }))} /></label>
        <label><span>Giờ nếu biết</span><input type="time" value={update.observedTime} onChange={(event) => setUpdate((current) => ({ ...current, observedTime: event.target.value }))} /></label>
        <label><span>Trạng thái tại thời điểm ghi</span><select value={update.status} onChange={(event) => setUpdate((current) => ({ ...current, status: event.target.value as EpisodeStatus }))}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Mức độ do người ghi mô tả</span><select value={update.severity} onChange={(event) => setUpdate((current) => ({ ...current, severity: event.target.value as SeverityText }))}>{Object.entries(severityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>Nhiệt độ nếu đã đo</span><div className="set-inline"><input inputMode="decimal" value={update.measuredTemperature} maxLength={40} onChange={(event) => setUpdate((current) => ({ ...current, measuredTemperature: event.target.value }))} /><select aria-label="Đơn vị nhiệt độ diễn biến" value={update.temperatureUnit} onChange={(event) => setUpdate((current) => ({ ...current, temperatureUnit: event.target.value as "C" | "F" }))}><option value="C">°C</option><option value="F">°F</option></select></div></label>
        <label><span>Nguồn thông tin</span><select value={update.sourceKind} onChange={(event) => setUpdate((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div><label className="set-wide"><span>Triệu chứng tại mốc này</span><textarea value={update.symptomsText} maxLength={MAX_LONG} onChange={(event) => setUpdate((current) => ({ ...current, symptomsText: event.target.value }))} /></label><label className="set-wide"><span>Diễn biến được quan sát</span><textarea value={update.note} maxLength={MAX_LONG} onChange={(event) => setUpdate((current) => ({ ...current, note: event.target.value }))} /></label><label className="set-wide"><span>Chăm sóc / tư vấn đã nhận</span><textarea value={update.careSought} maxLength={MAX_LONG} onChange={(event) => setUpdate((current) => ({ ...current, careSought: event.target.value }))} /></label><label className="set-wide"><span>Ghi nguồn</span><textarea value={update.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setUpdate((current) => ({ ...current, sourceNote: event.target.value }))} /></label><button type="button" className="hf-primary set-save" onClick={() => void saveUpdate()}>Mã hóa & thêm diễn biến</button>
        {selectedUpdates.length ? <div className="set-update-list">{selectedUpdates.map((item) => <article key={item.recordId}><div><span>{formatDate(item.data.observedDate)}{item.data.observedTime ? ` · ${item.data.observedTime}` : ""}</span><strong>{statusLabels[item.data.status]} · {severityLabels[item.data.severity]}</strong></div>{item.data.symptoms.length ? <p>{item.data.symptoms.join(" · ")}</p> : null}{item.data.note ? <p>{item.data.note}</p> : null}{item.data.measuredTemperature ? <small>Nhiệt độ đã nhập: {item.data.measuredTemperature} °{item.data.temperatureUnit}</small> : null}{item.data.careSought ? <small>Chăm sóc/tư vấn: {item.data.careSought}</small> : null}<small>Nguồn: {sourceLabels[item.data.sourceKind]}{item.data.sourceNote ? ` · ${item.data.sourceNote}` : ""}</small><button type="button" className="set-delete" onClick={() => void removeRecord(item)}>Xóa cập nhật</button></article>)}</div> : <p className="hf-muted">Chưa có diễn biến bổ sung cho episode này.</p>}</section> : null}

      <div className="set-safety" role="note"><strong>Giới hạn V1:</strong><span>Không triage, không red-flag engine, không tự chẩn đoán, không kê đơn và không suy mức nguy hiểm. Nếu tình trạng có vẻ nghiêm trọng hoặc xấu đi rõ rệt, cần tìm hỗ trợ y tế phù hợp thay vì dựa vào module này.</span></div>{notice ? <div className="set-notice" role="status">{notice}</div> : null}
    </> : null}
  </section>;
}
