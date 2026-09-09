"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteVaultRecord, listVaultRecords, putVaultRecord, type VaultPayloadEnvelope } from "./health-secure-vault";
import { HEALTH_VIEWER_ROLE_LABELS } from "./health-profile-privacy";
import { useSensitiveVaultDomain } from "./use-sensitive-vault-domain";
import styles from "./injury-sports-musculoskeletal.module.css";

export const INJURY_SPORTS_DOMAIN_ID = "injury-sports-musculoskeletal";
export const INJURY_EPISODE_RECORD_KIND = "injury-episode-v1";

const MAX_SHORT = 140;
const MAX_MEDIUM = 500;
const MAX_LONG = 1_400;

type SourceKind = "self" | "caregiver" | "clinician-document";

type InjuryEpisodeData = {
  kind: typeof INJURY_EPISODE_RECORD_KIND;
  occurredAt: string;
  activity: string;
  bodyArea: string;
  injuryType: string;
  painLevel0to10: number | null;
  headImpactConcern: boolean;
  stoppedActivity: boolean;
  medicalCareSought: boolean;
  returnToActivityDate: string;
  clinicianClearanceReference: string;
  sourceKind: SourceKind;
  note: string;
};

type InjuryEnvelope = VaultPayloadEnvelope<InjuryEpisodeData>;

const sourceLabels: Record<SourceKind, string> = {
  self: "Người dùng tự ghi",
  caregiver: "Người chăm sóc ghi",
  "clinician-document": "Chép từ tài liệu / hướng dẫn chuyên môn",
};

function validDate(value: unknown) {
  return typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function validDateTime(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function isInjuryEpisode(record: VaultPayloadEnvelope<unknown>): record is InjuryEnvelope {
  if (record.domainId !== INJURY_SPORTS_DOMAIN_ID || !record.data || typeof record.data !== "object") return false;
  const data = record.data as Partial<InjuryEpisodeData>;
  return data.kind === INJURY_EPISODE_RECORD_KIND
    && validDateTime(data.occurredAt)
    && typeof data.activity === "string"
    && typeof data.bodyArea === "string"
    && typeof data.injuryType === "string"
    && (data.painLevel0to10 === null || (typeof data.painLevel0to10 === "number" && data.painLevel0to10 >= 0 && data.painLevel0to10 <= 10))
    && typeof data.headImpactConcern === "boolean"
    && typeof data.stoppedActivity === "boolean"
    && typeof data.medicalCareSought === "boolean"
    && validDate(data.returnToActivityDate)
    && typeof data.clinicianClearanceReference === "string"
    && (data.sourceKind === "self" || data.sourceKind === "caregiver" || data.sourceKind === "clinician-document")
    && typeof data.note === "string";
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

function localDateTimeNow() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDate(value: string) {
  if (!value) return "Chưa ghi";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
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

  const [records, setRecords] = useState<InjuryEnvelope[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [occurredAt, setOccurredAt] = useState(localDateTimeNow);
  const [activity, setActivity] = useState("");
  const [bodyArea, setBodyArea] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [pain, setPain] = useState("");
  const [headImpactConcern, setHeadImpactConcern] = useState(false);
  const [stoppedActivity, setStoppedActivity] = useState(false);
  const [medicalCareSought, setMedicalCareSought] = useState(false);
  const [returnToActivityDate, setReturnToActivityDate] = useState("");
  const [clearanceReference, setClearanceReference] = useState("");
  const [sourceKind, setSourceKind] = useState<SourceKind>("caregiver");
  const [note, setNote] = useState("");

  const loadRecords = useCallback(async () => {
    if (!privacyAllowed || status !== "unlocked" || !key) {
      setRecords([]);
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const vaultRecords = await listVaultRecords(key, profileId);
      setRecords(vaultRecords.filter(isInjuryEpisode).sort((a, b) => b.data.occurredAt.localeCompare(a.data.occurredAt)));
    } catch (error) {
      setRecords([]);
      setNotice(error instanceof Error ? error.message : "Không thể đọc nhật ký chấn thương.");
    } finally {
      setLoading(false);
    }
  }, [key, privacyAllowed, profileId, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  const headImpactCount = useMemo(() => records.filter((record) => record.data.headImpactConcern).length, [records]);

  async function saveEpisode() {
    const cleanedArea = clip(bodyArea, MAX_SHORT);
    const cleanedType = clip(injuryType, MAX_SHORT);
    if (!occurredAt || !cleanedArea || !cleanedType || !privacyAllowed || status !== "unlocked" || !key) return;
    const painNumber = pain.trim() === "" ? null : Number(pain);
    if (painNumber !== null && (!Number.isFinite(painNumber) || painNumber < 0 || painNumber > 10)) {
      setNotice("Mức đau chỉ dùng để ghi lại theo thang 0–10 và phải nằm trong khoảng 0 đến 10.");
      return;
    }
    const now = new Date().toISOString();
    const payload: InjuryEnvelope = {
      schemaVersion: 1,
      profileId,
      recordId: crypto.randomUUID(),
      domainId: INJURY_SPORTS_DOMAIN_ID,
      createdAt: now,
      updatedAt: now,
      data: {
        kind: INJURY_EPISODE_RECORD_KIND,
        occurredAt,
        activity: clip(activity, MAX_SHORT),
        bodyArea: cleanedArea,
        injuryType: cleanedType,
        painLevel0to10: painNumber,
        headImpactConcern,
        stoppedActivity,
        medicalCareSought,
        returnToActivityDate,
        clinicianClearanceReference: clip(clearanceReference, MAX_MEDIUM),
        sourceKind,
        note: clip(note, MAX_LONG),
      },
    };
    try {
      await putVaultRecord(key, payload);
      setOccurredAt(localDateTimeNow());
      setActivity("");
      setBodyArea("");
      setInjuryType("");
      setPain("");
      setHeadImpactConcern(false);
      setStoppedActivity(false);
      setMedicalCareSought(false);
      setReturnToActivityDate("");
      setClearanceReference("");
      setNote("");
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã mã hóa và lưu episode chấn thương. Bản ghi này không phải chẩn đoán hoặc giấy xác nhận đủ điều kiện vận động.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể lưu episode chấn thương.");
    }
  }

  async function removeEpisode(record: InjuryEnvelope) {
    if (!privacyAllowed || status !== "unlocked" || !key) return;
    if (!window.confirm("Xóa vĩnh viễn episode chấn thương này khỏi Secure Vault?")) return;
    try {
      await deleteVaultRecord(key, profileId, record.recordId);
      await loadRecords();
      await refreshRecordCount();
      setNotice("Đã xóa episode chấn thương khỏi Secure Vault.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Không thể xóa episode chấn thương.");
    }
  }

  return <section className={styles.module} aria-label="Chấn thương, thể thao và cơ xương khớp">
    <header className={styles.header}>
      <div>
        <span>INJURY & SPORTS V1 · SECURE VAULT</span>
        <h3>Chấn thương, thể thao & cơ xương khớp</h3>
        <p>Ghi lại sự kiện đã xảy ra, hoạt động liên quan, vùng cơ thể, mức đau tự ghi và quá trình trở lại vận động. Ứng dụng không tự chẩn đoán và không tự cấp quyền quay lại tập luyện/thi đấu.</p>
      </div>
      <div className={styles.state}><strong>{privacyReady ? visibilityLabel : "Đang đọc quyền…"}</strong><small>{HEALTH_VIEWER_ROLE_LABELS[role]}</small></div>
    </header>

    {!privacyReady ? <div className={styles.lock}>Đang đọc quyền riêng tư của hồ sơ…</div> : null}
    {privacyReady && visibility === "unconfigured" ? <div className={`${styles.lock} ${styles.warning}`}><strong>Miền này đang khóa mặc định.</strong><span>Hãy cấu hình quyền “Chấn thương, thể thao & cơ xương khớp” trong Profile Privacy trước khi lưu dữ liệu.</span></div> : null}
    {privacyReady && visibility !== "unconfigured" && !privacyAllowed ? <div className={styles.lock}><strong>Không được phép xem với vai trò hiện tại.</strong><span>Dữ liệu không được tải hoặc giải mã.</span></div> : null}
    {privacyReady && privacyAllowed && status !== "unlocked" ? <div className={styles.lock}><strong>{status === "unsupported" ? "Trình duyệt không hỗ trợ Secure Vault." : status === "not-configured" ? "Secure Vault chưa được thiết lập." : "Secure Vault đang khóa."}</strong><span>Mở Secure Vault trong khu Module chuyên sâu để đọc/ghi episode chấn thương.</span></div> : null}

    {privacyReady && privacyAllowed && status === "unlocked" && key ? <>
      <div className={styles.guardrail}>
        <strong>Ranh giới an toàn</strong>
        <span>Nếu có chấn thương đầu/cổ, dấu hiệu nghiêm trọng hoặc tình trạng xấu đi, ưu tiên đánh giá y tế phù hợp thay vì dùng nhật ký để tự quyết định tiếp tục vận động. Sau va chạm đầu, ứng dụng không tự xác nhận “đủ an toàn để quay lại thi đấu”.</span>
      </div>

      <div className={styles.metrics}>
        <div><strong>{records.length}</strong><span>episode đã lưu</span></div>
        <div><strong>{headImpactCount}</strong><span>episode có ghi nhận lo ngại va chạm đầu</span></div>
        <div><strong>{records.filter((record) => record.data.medicalCareSought).length}</strong><span>episode đã tìm chăm sóc y tế</span></div>
      </div>

      <section className={styles.form}>
        <div className={styles.titleRow}><div><span>GHI SỰ KIỆN</span><h4>Thêm episode chấn thương</h4></div><small>Chỉ lưu cục bộ đã mã hóa</small></div>
        <div className={styles.grid}>
          <label><span>Thời điểm xảy ra *</span><input type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></label>
          <label><span>Hoạt động lúc xảy ra</span><input value={activity} maxLength={MAX_SHORT} onChange={(event) => setActivity(event.target.value)} placeholder="Ví dụ: chạy, bóng đá, sinh hoạt…" /></label>
          <label><span>Vùng cơ thể *</span><input value={bodyArea} maxLength={MAX_SHORT} onChange={(event) => setBodyArea(event.target.value)} placeholder="Ví dụ: cổ chân phải" /></label>
          <label><span>Loại chấn thương đã ghi nhận *</span><input value={injuryType} maxLength={MAX_SHORT} onChange={(event) => setInjuryType(event.target.value)} placeholder="Ví dụ: bong gân đã được ghi nhận / va đập" /></label>
          <label><span>Mức đau tự ghi 0–10</span><input type="number" min={0} max={10} step={1} value={pain} onChange={(event) => setPain(event.target.value)} placeholder="Không bắt buộc" /></label>
          <label><span>Nguồn bản ghi</span><select value={sourceKind} onChange={(event) => setSourceKind(event.target.value as SourceKind)}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Ngày đã quay lại hoạt động (nếu đã xảy ra)</span><input type="date" value={returnToActivityDate} onChange={(event) => setReturnToActivityDate(event.target.value)} /></label>
          <label><span>Tham chiếu đánh giá/clearance (nếu có)</span><input value={clearanceReference} maxLength={MAX_MEDIUM} onChange={(event) => setClearanceReference(event.target.value)} placeholder="Tên tài liệu, nơi khám hoặc ghi chú tham chiếu" /></label>
        </div>
        <div className={styles.checks}>
          <label><input type="checkbox" checked={headImpactConcern} onChange={(event) => setHeadImpactConcern(event.target.checked)} /><span>Có ghi nhận lo ngại va chạm đầu</span></label>
          <label><input type="checkbox" checked={stoppedActivity} onChange={(event) => setStoppedActivity(event.target.checked)} /><span>Đã dừng hoạt động sau sự kiện</span></label>
          <label><input type="checkbox" checked={medicalCareSought} onChange={(event) => setMedicalCareSought(event.target.checked)} /><span>Đã tìm chăm sóc/đánh giá y tế</span></label>
        </div>
        {headImpactConcern ? <div className={styles.headWarning}><strong>Va chạm đầu được đánh dấu.</strong><span>Không sử dụng ngày quay lại hoạt động trong app như một “clearance”. Nếu việc trở lại thể thao cần đánh giá chuyên môn, hãy dựa vào hướng dẫn/chuyên gia phù hợp.</span></div> : null}
        <label className={styles.note}><span>Ghi chú</span><textarea value={note} maxLength={MAX_LONG} onChange={(event) => setNote(event.target.value)} placeholder="Diễn biến, hạn chế vận động, hướng dẫn đã nhận hoặc điều cần nhớ…" /></label>
        <button type="button" className={styles.primary} disabled={!occurredAt || !bodyArea.trim() || !injuryType.trim()} onClick={() => void saveEpisode()}>Mã hóa & lưu episode</button>
      </section>

      <section className={styles.history}>
        <div className={styles.titleRow}><div><span>LỊCH SỬ</span><h4>Episode đã lưu</h4></div><small>{loading ? "Đang đọc…" : `${records.length} bản ghi`}</small></div>
        {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
        {!loading && !records.length ? <div className={styles.empty}>Chưa có episode chấn thương trong hồ sơ này.</div> : null}
        {records.map((record) => <article key={record.recordId} className={styles.record}>
          <div className={styles.recordHead}><div><strong>{record.data.bodyArea}</strong><span>{record.data.injuryType}</span></div><time>{formatDateTime(record.data.occurredAt)}</time></div>
          <div className={styles.tags}>
            {record.data.activity ? <span>{record.data.activity}</span> : null}
            {record.data.painLevel0to10 !== null ? <span>Đau tự ghi: {record.data.painLevel0to10}/10</span> : null}
            {record.data.stoppedActivity ? <span>Đã dừng hoạt động</span> : null}
            {record.data.medicalCareSought ? <span>Đã tìm chăm sóc y tế</span> : null}
            {record.data.headImpactConcern ? <b>Lo ngại va chạm đầu</b> : null}
          </div>
          {record.data.note ? <p>{record.data.note}</p> : null}
          <dl>
            <div><dt>Nguồn</dt><dd>{sourceLabels[record.data.sourceKind]}</dd></div>
            <div><dt>Quay lại hoạt động</dt><dd>{formatDate(record.data.returnToActivityDate)}</dd></div>
            {record.data.clinicianClearanceReference ? <div><dt>Tham chiếu</dt><dd>{record.data.clinicianClearanceReference}</dd></div> : null}
          </dl>
          <button type="button" className={styles.delete} onClick={() => void removeEpisode(record)}>Xóa bản ghi</button>
        </article>)}
      </section>
    </> : null}
  </section>;
}
