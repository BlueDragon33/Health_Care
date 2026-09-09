"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";

export const INJURY_SPORTS_DOMAIN_ID = "injury-sports-musculoskeletal";
export const INJURY_EPISODE_RECORD_KIND = "injury-episode-v1";

const MAX_SHORT = 140;
const MAX_MEDIUM = 520;
const MAX_LONG = 1_600;

type EpisodeStatus = "open" | "monitoring" | "resolved" | "referred";
type SourceKind = "self" | "caregiver" | "coach-school" | "clinician" | "medical-document" | "other";

type InjuryEpisodeData = {
  kind: typeof INJURY_EPISODE_RECORD_KIND;
  occurredAt: string;
  activity: string;
  bodyArea: string;
  mechanism: string;
  symptomNotes: string;
  painLevel0to10: number | null;
  headImpactConcern: boolean;
  stoppedActivity: boolean;
  medicalCareSought: boolean;
  episodeStatus: EpisodeStatus;
  followUpDate: string;
  actionTakenText: string;
  outcomeText: string;
  returnToActivityNote: string;
  clinicianClearanceRecorded: boolean;
  sourceKind: SourceKind;
  sourceNote: string;
};

type InjuryEpisodeEnvelope = VaultPayloadEnvelope<InjuryEpisodeData>;

type FormState = {
  occurredAt: string;
  activity: string;
  bodyArea: string;
  mechanism: string;
  symptomNotes: string;
  painLevel: string;
  headImpactConcern: boolean;
  stoppedActivity: boolean;
  medicalCareSought: boolean;
  episodeStatus: EpisodeStatus;
  followUpDate: string;
  actionTakenText: string;
  outcomeText: string;
  returnToActivityNote: string;
  clinicianClearanceRecorded: boolean;
  sourceKind: SourceKind;
  sourceNote: string;
};

const statusLabels: Record<EpisodeStatus, string> = {
  open: "Đang mở",
  monitoring: "Đang theo dõi",
  resolved: "Đã kết thúc",
  referred: "Đã đi khám / chuyển đánh giá",
};

const sourceLabels: Record<SourceKind, string> = {
  self: "Người được theo dõi tự ghi",
  caregiver: "Phụ huynh / người chăm sóc",
  "coach-school": "Huấn luyện viên / nhà trường",
  clinician: "Nhân viên y tế",
  "medical-document": "Tài liệu / hồ sơ y tế",
  other: "Nguồn khác",
};

function emptyForm(): FormState {
  return {
    occurredAt: localDateTimeValue(new Date()),
    activity: "",
    bodyArea: "",
    mechanism: "",
    symptomNotes: "",
    painLevel: "",
    headImpactConcern: false,
    stoppedActivity: false,
    medicalCareSought: false,
    episodeStatus: "open",
    followUpDate: "",
    actionTakenText: "",
    outcomeText: "",
    returnToActivityNote: "",
    clinicianClearanceRecorded: false,
    sourceKind: "caregiver",
    sourceNote: "",
  };
}

function clip(value: string, max = MAX_MEDIUM) {
  return value.trim().slice(0, max);
}

function localDateTimeValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromIsoToLocalInput(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? localDateTimeValue(date) : "";
}

function toIsoDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function validDate(value: unknown) {
  return typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function validStatus(value: unknown): value is EpisodeStatus {
  return value === "open" || value === "monitoring" || value === "resolved" || value === "referred";
}

function validSource(value: unknown): value is SourceKind {
  return value === "self" || value === "caregiver" || value === "coach-school" || value === "clinician" || value === "medical-document" || value === "other";
}

function isInjuryEpisode(record: VaultPayloadEnvelope<unknown>): record is InjuryEpisodeEnvelope {
  if (record.domainId !== INJURY_SPORTS_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<InjuryEpisodeData>;
  return data.kind === INJURY_EPISODE_RECORD_KIND
    && typeof data.occurredAt === "string"
    && Number.isFinite(Date.parse(data.occurredAt))
    && typeof data.activity === "string"
    && typeof data.bodyArea === "string"
    && typeof data.mechanism === "string"
    && typeof data.symptomNotes === "string"
    && (data.painLevel0to10 === null || (typeof data.painLevel0to10 === "number" && data.painLevel0to10 >= 0 && data.painLevel0to10 <= 10))
    && typeof data.headImpactConcern === "boolean"
    && typeof data.stoppedActivity === "boolean"
    && typeof data.medicalCareSought === "boolean"
    && validStatus(data.episodeStatus)
    && validDate(data.followUpDate)
    && typeof data.actionTakenText === "string"
    && typeof data.outcomeText === "string"
    && typeof data.returnToActivityNote === "string"
    && typeof data.clinicianClearanceRecorded === "boolean"
    && validSource(data.sourceKind)
    && typeof data.sourceNote === "string";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date)
    : value;
}

function formatDate(value: string) {
  if (!value) return "Chưa đặt";
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date) : value;
}

export default function InjurySportsMusculoskeletal() {
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
  } = useSensitiveVaultDomain(INJURY_SPORTS_DOMAIN_ID);

  const [records, setRecords] = useState<InjuryEpisodeEnvelope[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [editingId, setEditingId] = useState("");
  const [editingCreatedAt, setEditingCreatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const openCount = useMemo(
    () => records.filter((record) => record.data.episodeStatus === "open" || record.data.episodeStatus === "monitoring").length,
    [records],
  );

  const loadRecords = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const vaultRecords = await listVaultRecords(key, profileId);
      const injuryRecords = vaultRecords.filter((record): record is InjuryEpisodeEnvelope => isInjuryEpisode(record));
      injuryRecords.sort((a, b) => Date.parse(b.data.occurredAt) - Date.parse(a.data.occurredAt));
      setRecords(injuryRecords);
    } catch (error) {
      setRecords([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc hồ sơ chấn thương.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId("");
    setEditingCreatedAt("");
  }

  function editEpisode(record: InjuryEpisodeEnvelope) {
    const data = record.data;
    setEditingId(record.recordId);
    setEditingCreatedAt(record.createdAt);
    setForm({
      occurredAt: fromIsoToLocalInput(data.occurredAt),
      activity: data.activity,
      bodyArea: data.bodyArea,
      mechanism: data.mechanism,
      symptomNotes: data.symptomNotes,
      painLevel: data.painLevel0to10 === null ? "" : String(data.painLevel0to10),
      headImpactConcern: data.headImpactConcern,
      stoppedActivity: data.stoppedActivity,
      medicalCareSought: data.medicalCareSought,
      episodeStatus: data.episodeStatus,
      followUpDate: data.followUpDate,
      actionTakenText: data.actionTakenText,
      outcomeText: data.outcomeText,
      returnToActivityNote: data.returnToActivityNote,
      clinicianClearanceRecorded: data.clinicianClearanceRecorded,
      sourceKind: data.sourceKind,
      sourceNote: data.sourceNote,
    });
    setNotice("Đang cập nhật episode đã chọn. Lưu lại để ghi diễn biến mới nhất.");
  }

  async function saveEpisode() {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    const occurredAt = toIsoDateTime(form.occurredAt);
    const bodyArea = clip(form.bodyArea, MAX_SHORT);
    if (!occurredAt || !bodyArea) {
      setNotice("Cần nhập thời điểm và vùng cơ thể bị ảnh hưởng.");
      return;
    }
    const rawPain = form.painLevel === "" ? null : Number(form.painLevel);
    if (rawPain !== null && (!Number.isInteger(rawPain) || rawPain < 0 || rawPain > 10)) {
      setNotice("Mức đau chỉ dùng thang ghi nhận 0–10 hoặc để trống.");
      return;
    }
    const now = new Date().toISOString();
    const payload: InjuryEpisodeEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: editingId || crypto.randomUUID(),
      domainId: INJURY_SPORTS_DOMAIN_ID,
      createdAt: editingCreatedAt || now,
      updatedAt: now,
      data: {
        kind: INJURY_EPISODE_RECORD_KIND,
        occurredAt,
        activity: clip(form.activity, MAX_SHORT),
        bodyArea,
        mechanism: clip(form.mechanism, MAX_MEDIUM),
        symptomNotes: clip(form.symptomNotes, MAX_LONG),
        painLevel0to10: rawPain,
        headImpactConcern: form.headImpactConcern,
        stoppedActivity: form.stoppedActivity,
        medicalCareSought: form.medicalCareSought,
        episodeStatus: form.episodeStatus,
        followUpDate: form.followUpDate,
        actionTakenText: clip(form.actionTakenText, MAX_LONG),
        outcomeText: clip(form.outcomeText, MAX_LONG),
        returnToActivityNote: clip(form.returnToActivityNote, MAX_MEDIUM),
        clinicianClearanceRecorded: form.clinicianClearanceRecorded,
        sourceKind: form.sourceKind,
        sourceNote: clip(form.sourceNote, MAX_MEDIUM),
      },
    };
    try {
      await putVaultRecord(key, payload);
      resetForm();
      await loadRecords();
      await refreshRecordCount();
      setNotice(editingId ? "Đã mã hóa và cập nhật diễn biến episode." : "Đã mã hóa và lưu episode chấn thương.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu episode chấn thương.");
    }
  }

  async function removeEpisode(record: InjuryEpisodeEnvelope) {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    if (!window.confirm("Xóa vĩnh viễn episode chấn thương này khỏi Secure Vault?")) return;
    try {
      await deleteVaultRecord(key, profileId, record.recordId);
      if (editingId === record.recordId) resetForm();
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã xóa episode khỏi Secure Vault.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa episode.");
    }
  }

  return <section className="ism" aria-label="Theo dõi chấn thương, thể thao và cơ xương khớp mã hóa">
    <header className="ism-head">
      <div>
        <span className="hf-kicker">Injury Episode V1 · Secure Vault</span>
        <h3>Chấn thương, thể thao & cơ xương khớp</h3>
        <p>Ghi một sự kiện từ lúc xảy ra đến diễn biến/kết thúc, có nguồn thông tin và theo dõi việc đi khám. Module không tự chẩn đoán, không tính điểm nguy cơ và không tự quyết định đủ điều kiện quay lại thể thao.</p>
      </div>
      <div className="ism-state"><strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong><span>{HEALTH_VIEWER_ROLE_LABELS[role]}</span><b>{openCount} episode đang theo dõi</b></div>
    </header>

    {!privacyReady ? <div className="ism-lock">Đang đọc quyền riêng tư của hồ sơ…</div> : null}
    {privacyReady && visibility === "unconfigured" ? <div className="ism-lock is-warning"><strong>Miền này đang khóa theo policy.</strong><span>Hãy cấu hình quyền riêng tư của hồ sơ trước khi mở dữ liệu.</span></div> : null}
    {privacyReady && visibility !== "unconfigured" && !privacyAllowed ? <div className="ism-lock"><strong>Ẩn với người đang xem hiện tại.</strong><span>Không tải hoặc giải mã dữ liệu khi policy không cho phép.</span></div> : null}
    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className="ism-lock"><strong>{status === "unsupported" ? "Trình duyệt không hỗ trợ Secure Vault." : "Cần mở Secure Vault."}</strong><span>Không có plaintext fallback cho episode chấn thương.</span></div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className="ism-safety-grid">
        <article className="ism-safety is-head"><strong>Nếu có va đập đầu / nghi chấn động</strong><p>Không quay lại thi đấu trong ngày. Việc trở lại thể thao sau nghi chấn động phải do nhân viên y tế đánh giá và cho phép; ứng dụng chỉ lưu bản ghi.</p><a href="https://www.cdc.gov/heads-up/response/index.html" target="_blank" rel="noreferrer">CDC HEADS UP ↗</a></article>
        <article className="ism-safety"><strong>Khi nào cần trợ giúp khẩn cấp</strong><p>Ưu tiên cấp cứu khi có khó đánh thức, co giật, lú lẫn tăng, nôn lặp lại sau va đập đầu; hoặc chấn thương biến dạng, tê/mất cảm giác, phần chi lạnh/đổi màu, chảy máu nhiều hay không thể sử dụng chi.</p><div><a href="https://www.cdc.gov/heads-up/signs-symptoms/index.html" target="_blank" rel="noreferrer">CDC ↗</a><a href="https://www.nhs.uk/conditions/sprains-and-strains/" target="_blank" rel="noreferrer">NHS ↗</a></div></article>
      </div>

      <section className="ism-editor" data-editing={editingId ? "true" : "false"}>
        <div className="ism-editor-head"><div><span>{editingId ? "CẬP NHẬT EPISODE" : "EPISODE MỚI"}</span><h4>{editingId ? "Ghi diễn biến / kết thúc" : "Ghi sự kiện chấn thương"}</h4></div>{editingId ? <button type="button" onClick={resetForm}>Hủy chỉnh sửa</button> : null}</div>
        <div className="ism-form-grid">
          <label>Thời điểm xảy ra<input type="datetime-local" value={form.occurredAt} onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))} /></label>
          <label>Hoạt động khi xảy ra<input value={form.activity} maxLength={MAX_SHORT} onChange={(event) => setForm((current) => ({ ...current, activity: event.target.value }))} placeholder="Bóng đá, chạy, sinh hoạt…" /></label>
          <label>Vùng cơ thể *<input value={form.bodyArea} maxLength={MAX_SHORT} onChange={(event) => setForm((current) => ({ ...current, bodyArea: event.target.value }))} placeholder="Cổ chân phải, đầu, vai trái…" /></label>
          <label>Mức đau tự ghi 0–10<input inputMode="numeric" value={form.painLevel} onChange={(event) => setForm((current) => ({ ...current, painLevel: event.target.value.replace(/[^0-9]/g, "").slice(0, 2) }))} placeholder="Có thể để trống" /></label>
          <label>Trạng thái episode<select value={form.episodeStatus} onChange={(event) => setForm((current) => ({ ...current, episodeStatus: event.target.value as EpisodeStatus }))}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Ngày theo dõi / tái khám<input type="date" value={form.followUpDate} onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))} /></label>
          <label>Nguồn thông tin<select value={form.sourceKind} onChange={(event) => setForm((current) => ({ ...current, sourceKind: event.target.value as SourceKind }))}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Ghi chú nguồn<input value={form.sourceNote} maxLength={MAX_MEDIUM} onChange={(event) => setForm((current) => ({ ...current, sourceNote: event.target.value }))} placeholder="Tên tài liệu/cơ sở/người ghi nếu cần" /></label>
        </div>
        <div className="ism-check-grid">
          <label><input type="checkbox" checked={form.headImpactConcern} onChange={(event) => setForm((current) => ({ ...current, headImpactConcern: event.target.checked }))} /><span><strong>Có va đập đầu / nghi chấn động</strong><small>Chỉ là cờ do người dùng ghi, không phải chẩn đoán.</small></span></label>
          <label><input type="checkbox" checked={form.stoppedActivity} onChange={(event) => setForm((current) => ({ ...current, stoppedActivity: event.target.checked }))} /><span><strong>Đã dừng hoạt động</strong><small>Ghi lại việc đã xảy ra.</small></span></label>
          <label><input type="checkbox" checked={form.medicalCareSought} onChange={(event) => setForm((current) => ({ ...current, medicalCareSought: event.target.checked }))} /><span><strong>Đã tìm trợ giúp y tế</strong><small>Không đồng nghĩa đã được chẩn đoán.</small></span></label>
          <label><input type="checkbox" checked={form.clinicianClearanceRecorded} onChange={(event) => setForm((current) => ({ ...current, clinicianClearanceRecorded: event.target.checked }))} /><span><strong>Đã có xác nhận trở lại hoạt động từ nhân viên y tế</strong><small>Chỉ đánh dấu khi có nguồn xác nhận thực tế.</small></span></label>
        </div>
        <div className="ism-text-grid">
          <label>Cách xảy ra / cơ chế<textarea value={form.mechanism} maxLength={MAX_MEDIUM} onChange={(event) => setForm((current) => ({ ...current, mechanism: event.target.value }))} placeholder="Ngã, va chạm, xoay cổ chân… chỉ mô tả sự kiện" /></label>
          <label>Triệu chứng / hạn chế chức năng<textarea value={form.symptomNotes} maxLength={MAX_LONG} onChange={(event) => setForm((current) => ({ ...current, symptomNotes: event.target.value }))} placeholder="Đau, sưng, khó vận động… theo điều người dùng quan sát/được ghi nhận" /></label>
          <label>Việc đã làm<textarea value={form.actionTakenText} maxLength={MAX_LONG} onChange={(event) => setForm((current) => ({ ...current, actionTakenText: event.target.value }))} placeholder="Nghỉ hoạt động, đi khám, xử trí đã được thực hiện…" /></label>
          <label>Diễn biến / kết quả<textarea value={form.outcomeText} maxLength={MAX_LONG} onChange={(event) => setForm((current) => ({ ...current, outcomeText: event.target.value }))} placeholder="Đỡ hơn, còn hạn chế, kết quả khám…" /></label>
          <label className="ism-span-2">Ghi chú trở lại hoạt động<textarea value={form.returnToActivityNote} maxLength={MAX_MEDIUM} onChange={(event) => setForm((current) => ({ ...current, returnToActivityNote: event.target.value }))} placeholder="Ghi đúng nội dung đã được hướng dẫn/xác nhận; ứng dụng không tự clearance" /></label>
        </div>
        {form.headImpactConcern ? <div className="ism-head-warning" role="note"><strong>Va đập đầu đã được đánh dấu.</strong><span>Không dùng trạng thái episode hoặc mức đau trong ứng dụng để quyết định quay lại thể thao. Nếu có dấu hiệu nguy hiểm hoặc triệu chứng tăng, cần trợ giúp y tế khẩn cấp.</span></div> : null}
        <button className="ism-save" type="button" onClick={() => void saveEpisode()}>{editingId ? "Lưu cập nhật episode" : "Mã hóa & lưu episode"}</button>
      </section>

      <section className="ism-list">
        <header><div><span>EPISODE ĐÃ LƯU</span><h4>Lịch sử chấn thương</h4></div><strong>{loading ? "Đang đọc…" : `${records.length} bản ghi`}</strong></header>
        {records.length ? records.map((record) => <article key={record.recordId} data-status={record.data.episodeStatus}>
          <div className="ism-record-main"><span>{statusLabels[record.data.episodeStatus]}</span><h5>{record.data.bodyArea}</h5><p>{record.data.activity || "Không ghi hoạt động"} · {formatDateTime(record.data.occurredAt)}</p></div>
          <div className="ism-record-flags">{record.data.headImpactConcern ? <b>Va đập đầu</b> : null}{record.data.painLevel0to10 !== null ? <span>Đau {record.data.painLevel0to10}/10</span> : null}{record.data.medicalCareSought ? <span>Đã đi khám</span> : null}{record.data.clinicianClearanceRecorded ? <span>Có xác nhận y tế</span> : null}</div>
          <div className="ism-record-detail"><p><strong>Diễn biến:</strong> {record.data.outcomeText || record.data.symptomNotes || "Chưa cập nhật"}</p><p><strong>Theo dõi:</strong> {formatDate(record.data.followUpDate)} · <strong>Nguồn:</strong> {sourceLabels[record.data.sourceKind]}</p>{record.data.returnToActivityNote ? <p><strong>Trở lại hoạt động:</strong> {record.data.returnToActivityNote}</p> : null}</div>
          <div className="ism-record-actions"><button type="button" onClick={() => editEpisode(record)}>Cập nhật</button><button type="button" className="is-danger" onClick={() => void removeEpisode(record)}>Xóa</button></div>
        </article>) : <div className="ism-empty">Chưa có episode chấn thương trong Secure Vault.</div>}
      </section>
    </> : null}

    {notice ? <div className="ism-notice" role="status">{notice}</div> : null}
  </section>;
}

export const INJURY_EPISODE_V1_GUARDRAILS = {
  vaultOnlyPersistence: true,
  provenanceRequiredInSchema: true,
  noGeneratedDiagnosis: true,
  noRiskScore: true,
  noAutomatedReturnToPlay: true,
  headImpactRequiresClinicalClearanceLanguage: true,
  noAdminOrNetworkDependency: true,
  noPlaintextWebStorageFallback: true,
} as const;
