export type SiteDeviceStatus = "pending" | "approved" | "blocked";
export type SiteDeviceType = "desktop" | "phone" | "tablet";
export type SiteDeviceClassificationConfidence = "high" | "medium" | "low";

export type SiteDeviceState = {
  deviceId: string;
  deviceCode: string;
  status: SiteDeviceStatus;
  deviceType: SiteDeviceType;
  platform: string | null;
  osName: string | null;
  browser: string | null;
  browserVersion: string | null;
  installationId: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  touchPoints: number;
  mobileHint: boolean;
  pwaMode: boolean;
  language: string | null;
  timezone: string | null;
  classificationConfidence: SiteDeviceClassificationConfidence;
  classificationReason: string | null;
  label: string | null;
  editEnabled: boolean;
  calendarEnabled: boolean;
};

export type SiteAccessPolicy = {
  accessEnabled: boolean;
  pendingPollSeconds: number;
  heartbeatSeconds: number;
  sessionTimeoutSeconds: number;
  sessionTtlMinutes: number;
  systemNoticeEnabled: boolean;
  systemNotice: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

export type SiteAccessSession = {
  sessionId: string;
  deviceId: string;
  deviceCode: string;
  deviceLabel: string | null;
  deviceType: SiteDeviceType;
  deviceStatus: SiteDeviceStatus;
  status: "active" | "revoked" | "expired";
  startedAt: string;
  lastSeenAt: string;
  expiresAt: number;
  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: string | null;
  active: boolean;
};

type SiteDeviceRow = {
  device_id: string;
  display_code: string;
  public_key_jwk: string;
  status: SiteDeviceStatus;
  device_type: SiteDeviceType;
  platform: string | null;
  browser: string | null;
  user_agent: string | null;
  screen_width: number | null;
  screen_height: number | null;
  installation_id: string | null;
  os_name: string | null;
  browser_version: string | null;
  mobile_hint: number;
  touch_points: number;
  viewport_width: number | null;
  viewport_height: number | null;
  pixel_ratio: number | null;
  pwa_mode: number;
  language: string | null;
  timezone: string | null;
  classification_confidence: SiteDeviceClassificationConfidence;
  classification_reason: string | null;
  metadata_updated_at: string;
  label: string | null;
  edit_enabled: number;
  calendar_enabled: number;
  created_at: string;
  approved_at: string | null;
  blocked_at: string | null;
  last_seen_at: string;
  last_activity_at: string;
};

type PolicyRow = {
  access_enabled: number;
  pending_poll_seconds: number;
  heartbeat_seconds: number;
  session_timeout_seconds: number;
  session_ttl_minutes: number;
  system_notice_enabled: number;
  system_notice: string | null;
  updated_by: string | null;
  updated_at: string;
};

type SessionRow = {
  session_id: string;
  device_id: string;
  display_code: string;
  label: string | null;
  device_type: SiteDeviceType;
  device_status: SiteDeviceStatus;
  status: "active" | "revoked" | "expired";
  started_at: string;
  last_seen_at: string;
  expires_at: number;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
};

export class DeviceAccessError extends Error {
  status: number;
  code: string;
  device?: SiteDeviceState;
  constructor(message: string, status: number, code: string, device?: SiteDeviceState) {
    super(message);
    this.status = status;
    this.code = code;
    this.device = device;
  }
}

export async function getCourseDatabase() {
  const workers = await import("cloudflare:workers");
  if (!workers.env.DB) throw new DeviceAccessError("Cơ sở dữ liệu Sức khỏe Y tế chưa sẵn sàng.", 503, "HEALTH_DATABASE_UNAVAILABLE");
  return workers.env.DB;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 256) {
    throw new DeviceAccessError("Chữ ký thiết bị không hợp lệ.", 400, "INVALID_DEVICE_SIGNATURE");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try { return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)); }
  catch { throw new DeviceAccessError("Chữ ký thiết bị không hợp lệ.", 400, "INVALID_DEVICE_SIGNATURE"); }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function publicKeyShape(value: unknown): JsonWebKey {
  if (!value || typeof value !== "object") throw new DeviceAccessError("Khóa thiết bị không hợp lệ.", 400, "INVALID_DEVICE_KEY");
  const source = value as Record<string, unknown>;
  const x = typeof source.x === "string" ? source.x : "";
  const y = typeof source.y === "string" ? source.y : "";
  if (source.kty !== "EC" || source.crv !== "P-256" || !/^[A-Za-z0-9_-]{42,44}$/.test(x) || !/^[A-Za-z0-9_-]{42,44}$/.test(y)) {
    throw new DeviceAccessError("Khóa thiết bị không hợp lệ.", 400, "INVALID_DEVICE_KEY");
  }
  return { kty: "EC", crv: "P-256", x, y, ext: true, key_ops: ["verify"] };
}

function canonicalKey(value: JsonWebKey) {
  return JSON.stringify({ kty: value.kty, crv: value.crv, x: value.x, y: value.y });
}

function displayCodeFor(deviceId: string) {
  return `SK-${deviceId.slice(0, 4)}-${deviceId.slice(4, 8)}-${deviceId.slice(8, 12)}-${deviceId.slice(12, 16)}`.toUpperCase();
}

function cleanText(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function boundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function classifyDevice(metadata: Record<string, unknown>): { type: SiteDeviceType; confidence: SiteDeviceClassificationConfidence; reason: string } {
  const ua = cleanText(metadata.userAgent, 500).toLowerCase();
  const platform = cleanText(metadata.platform, 80).toLowerCase();
  const mobileHint = metadata.mobile === true;
  const touchPoints = Math.max(0, Math.min(20, Number(metadata.maxTouchPoints) || 0));
  const screenWidth = Math.max(0, Math.min(10000, Math.round(Number(metadata.screenWidth) || 0)));
  const screenHeight = Math.max(0, Math.min(10000, Math.round(Number(metadata.screenHeight) || 0)));
  const shortSide = screenWidth && screenHeight ? Math.min(screenWidth, screenHeight) : 0;
  const ipad = ua.includes("ipad") || (platform.includes("mac") && touchPoints > 1);
  const explicitTablet = ipad || ua.includes("tablet") || (ua.includes("android") && !ua.includes("mobile"));
  const explicitPhone = ua.includes("iphone") || ua.includes("ipod") || /android.+mobile/.test(ua) || ua.includes("windows phone");
  if (explicitTablet) return { type: "tablet", confidence: "high", reason: ipad ? "ipad-signal" : "tablet-user-agent" };
  if (explicitPhone) return { type: "phone", confidence: "high", reason: "phone-user-agent" };
  if (mobileHint && touchPoints > 0 && shortSide >= 600) return { type: "tablet", confidence: "medium", reason: "mobile-hint-large-touch-screen" };
  if (mobileHint) return { type: "phone", confidence: "high", reason: "client-hints-mobile" };
  if (touchPoints > 0 && shortSide > 0 && shortSide <= 520) return { type: "phone", confidence: "medium", reason: "small-touch-screen" };
  if ((platform.includes("win") || platform.includes("mac") || platform.includes("linux") || platform.includes("cros")) && !mobileHint) {
    return { type: "desktop", confidence: "high", reason: "desktop-platform" };
  }
  if (touchPoints > 0 && shortSide >= 600 && shortSide <= 1400) return { type: "tablet", confidence: "low", reason: "large-touch-screen" };
  return { type: "desktop", confidence: "low", reason: "fallback-desktop" };
}

function detectBrowser(userAgent: string) {
  const candidates: [string, RegExp][] = [
    ["Edge", /edg(?:a|ios)?\/([0-9.]+)/i],
    ["Chrome", /(?:chrome|crios)\/([0-9.]+)/i],
    ["Firefox", /(?:firefox|fxios)\/([0-9.]+)/i],
    ["Safari", /version\/([0-9.]+).*safari/i],
  ];
  for (const [name, pattern] of candidates) {
    const match = userAgent.match(pattern);
    if (match) return { name, version: match[1] ?? null };
  }
  return { name: "Khác", version: null };
}

function detectOsName(metadata: Record<string, unknown>, userAgent: string) {
  const ua = userAgent.toLowerCase();
  const platform = cleanText(metadata.platform, 80).toLowerCase();
  const touchPoints = Math.max(0, Math.min(20, Number(metadata.maxTouchPoints) || 0));
  if (ua.includes("ipad") || (platform.includes("mac") && touchPoints > 1)) return "iPadOS";
  if (ua.includes("iphone") || ua.includes("ipod")) return "iOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows") || platform.includes("win")) return "Windows";
  if (ua.includes("cros") || platform.includes("cros")) return "ChromeOS";
  if (ua.includes("mac os") || platform.includes("mac")) return "macOS";
  if (ua.includes("linux") || platform.includes("linux")) return "Linux";
  return cleanText(metadata.platform, 80) || null;
}

function state(row: SiteDeviceRow): SiteDeviceState {
  return {
    deviceId: row.device_id,
    deviceCode: row.display_code,
    status: row.status,
    deviceType: row.device_type,
    platform: row.platform,
    osName: row.os_name,
    browser: row.browser,
    browserVersion: row.browser_version,
    installationId: row.installation_id,
    screenWidth: row.screen_width,
    screenHeight: row.screen_height,
    viewportWidth: row.viewport_width,
    viewportHeight: row.viewport_height,
    touchPoints: row.touch_points,
    mobileHint: row.mobile_hint === 1,
    pwaMode: row.pwa_mode === 1,
    language: row.language,
    timezone: row.timezone,
    classificationConfidence: row.classification_confidence,
    classificationReason: row.classification_reason,
    label: row.label,
    editEnabled: row.edit_enabled === 1,
    calendarEnabled: row.calendar_enabled === 1,
  };
}

function policyState(row: PolicyRow): SiteAccessPolicy {
  return {
    accessEnabled: row.access_enabled === 1,
    pendingPollSeconds: boundedInteger(row.pending_poll_seconds, 60, 15, 300),
    heartbeatSeconds: boundedInteger(row.heartbeat_seconds, 60, 30, 300),
    sessionTimeoutSeconds: boundedInteger(row.session_timeout_seconds, 180, 60, 1800),
    sessionTtlMinutes: boundedInteger(row.session_ttl_minutes, 720, 30, 10080),
    systemNoticeEnabled: row.system_notice_enabled === 1,
    systemNotice: row.system_notice?.trim() || null,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

async function rowFor(deviceId: string) {
  const database = await getCourseDatabase();
  return database.prepare(
    `SELECT device_id, display_code, public_key_jwk, status, device_type, platform, browser,
            user_agent, screen_width, screen_height, installation_id, os_name, browser_version,
            mobile_hint, touch_points, viewport_width, viewport_height, pixel_ratio, pwa_mode, language,
            timezone, classification_confidence, classification_reason, metadata_updated_at,
            label, edit_enabled, calendar_enabled, created_at, approved_at, blocked_at, last_seen_at, last_activity_at
       FROM site_access_devices WHERE device_id = ?`,
  ).bind(deviceId).first<SiteDeviceRow>();
}

export async function getSiteAccessPolicy() {
  const database = await getCourseDatabase();
  let row = await database.prepare(
    `SELECT access_enabled, pending_poll_seconds, heartbeat_seconds, session_timeout_seconds,
            session_ttl_minutes, system_notice_enabled, system_notice, updated_by, updated_at
       FROM site_control_policy WHERE id = 1`,
  ).first<PolicyRow>();
  if (!row) {
    await database.prepare(
      `INSERT OR IGNORE INTO site_control_policy
        (id, access_enabled, pending_poll_seconds, heartbeat_seconds, session_timeout_seconds, session_ttl_minutes, system_notice_enabled)
       VALUES (1, 1, 60, 60, 180, 720, 0)`,
    ).run();
    row = await database.prepare(
      `SELECT access_enabled, pending_poll_seconds, heartbeat_seconds, session_timeout_seconds,
              session_ttl_minutes, system_notice_enabled, system_notice, updated_by, updated_at
         FROM site_control_policy WHERE id = 1`,
    ).first<PolicyRow>();
  }
  if (!row) throw new DeviceAccessError("Không thể đọc chính sách truy cập Sức khỏe Y tế.", 503, "HEALTH_POLICY_UNAVAILABLE");
  return policyState(row);
}

export async function updateSiteAccessPolicy(actor: string, payload: Record<string, unknown>) {
  const current = await getSiteAccessPolicy();
  const next = {
    accessEnabled: typeof payload.accessEnabled === "boolean" ? payload.accessEnabled : current.accessEnabled,
    pendingPollSeconds: boundedInteger(payload.pendingPollSeconds, current.pendingPollSeconds, 15, 300),
    heartbeatSeconds: boundedInteger(payload.heartbeatSeconds, current.heartbeatSeconds, 30, 300),
    sessionTimeoutSeconds: boundedInteger(payload.sessionTimeoutSeconds, current.sessionTimeoutSeconds, 60, 1800),
    sessionTtlMinutes: boundedInteger(payload.sessionTtlMinutes, current.sessionTtlMinutes, 30, 10080),
    systemNoticeEnabled: typeof payload.systemNoticeEnabled === "boolean" ? payload.systemNoticeEnabled : current.systemNoticeEnabled,
    systemNotice: typeof payload.systemNotice === "string" ? payload.systemNotice.trim().slice(0, 280) : current.systemNotice,
  };
  const database = await getCourseDatabase();
  await database.prepare(
    `UPDATE site_control_policy
        SET access_enabled = ?, pending_poll_seconds = ?, heartbeat_seconds = ?, session_timeout_seconds = ?,
            session_ttl_minutes = ?, system_notice_enabled = ?, system_notice = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
  ).bind(
    next.accessEnabled ? 1 : 0,
    next.pendingPollSeconds,
    next.heartbeatSeconds,
    next.sessionTimeoutSeconds,
    next.sessionTtlMinutes,
    next.systemNoticeEnabled ? 1 : 0,
    next.systemNotice || null,
    actor.trim().slice(0, 160) || "system",
  ).run();
  await auditHealthControlEvent(actor, "site_policy_updated", "child-health", next);
  return getSiteAccessPolicy();
}

export async function registerSiteDevice(publicKey: unknown, metadataValue: unknown, autoApprove = false) {
  const key = publicKeyShape(publicKey);
  const serialized = canonicalKey(key);
  const deviceId = await sha256(serialized);
  const metadata = metadataValue && typeof metadataValue === "object" ? metadataValue as Record<string, unknown> : {};
  const userAgent = cleanText(metadata.userAgent, 500);
  const platform = cleanText(metadata.platform, 80) || null;
  const browserInfo = detectBrowser(userAgent);
  const classification = classifyDevice(metadata);
  const osName = detectOsName(metadata, userAgent);
  const installationRaw = cleanText(metadata.installationId, 80);
  const installationId = /^[A-Za-z0-9._:-]{8,80}$/.test(installationRaw) ? installationRaw : null;
  const screenWidth = Math.max(0, Math.min(10000, Math.round(Number(metadata.screenWidth) || 0))) || null;
  const screenHeight = Math.max(0, Math.min(10000, Math.round(Number(metadata.screenHeight) || 0))) || null;
  const viewportWidth = Math.max(0, Math.min(10000, Math.round(Number(metadata.viewportWidth) || 0))) || null;
  const viewportHeight = Math.max(0, Math.min(10000, Math.round(Number(metadata.viewportHeight) || 0))) || null;
  const pixelRatio = Math.max(0.25, Math.min(10, Number(metadata.pixelRatio) || 1));
  const touchPoints = Math.max(0, Math.min(20, Math.round(Number(metadata.maxTouchPoints) || 0)));
  const mobileHint = metadata.mobile === true;
  const pwaMode = metadata.pwaMode === true;
  const language = cleanText(metadata.language, 40) || null;
  const timezone = cleanText(metadata.timezone, 80) || null;
  const database = await getCourseDatabase();
  const existing = await rowFor(deviceId);
  if (existing) {
    await database.prepare(
      `UPDATE site_access_devices SET device_type = ?, platform = ?, os_name = ?, browser = ?, browser_version = ?,
              user_agent = ?, installation_id = COALESCE(?, installation_id), screen_width = ?, screen_height = ?,
              viewport_width = ?, viewport_height = ?, pixel_ratio = ?, mobile_hint = ?, touch_points = ?, pwa_mode = ?,
              language = ?, timezone = ?, classification_confidence = ?, classification_reason = ?,
              metadata_updated_at = CURRENT_TIMESTAMP, last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE device_id = ?`,
    ).bind(
      classification.type, platform, osName, browserInfo.name, browserInfo.version, userAgent || null, installationId,
      screenWidth, screenHeight, viewportWidth, viewportHeight, pixelRatio, mobileHint ? 1 : 0, touchPoints, pwaMode ? 1 : 0,
      language, timezone, classification.confidence, classification.reason, deviceId,
    ).run();
    const updated = await rowFor(deviceId);
    return state(updated ?? existing);
  }
  const status: SiteDeviceStatus = autoApprove ? "approved" : "pending";
  await database.prepare(
    `INSERT INTO site_access_devices
      (device_id, display_code, public_key_jwk, status, device_type, platform, os_name, browser, browser_version,
       user_agent, installation_id, screen_width, screen_height, viewport_width, viewport_height, pixel_ratio,
       mobile_hint, touch_points, pwa_mode, language, timezone, classification_confidence, classification_reason, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${autoApprove ? "CURRENT_TIMESTAMP" : "NULL"})`,
  ).bind(
    deviceId, displayCodeFor(deviceId), serialized, status, classification.type, platform, osName, browserInfo.name,
    browserInfo.version, userAgent || null, installationId, screenWidth, screenHeight, viewportWidth, viewportHeight,
    pixelRatio, mobileHint ? 1 : 0, touchPoints, pwaMode ? 1 : 0, language, timezone,
    classification.confidence, classification.reason,
  ).run();
  const created = await rowFor(deviceId);
  if (!created) throw new DeviceAccessError("Không thể đăng ký thiết bị Sức khỏe Y tế.", 500, "DEVICE_CREATE_FAILED");
  await auditHealthControlEvent("system", "site_device_registered", deviceId, {
    deviceCode: created.display_code,
    deviceType: classification.type,
    classificationConfidence: classification.confidence,
    classificationReason: classification.reason,
    osName,
    browser: browserInfo.name,
  });
  return state(created);
}

export async function createSiteDeviceChallenge(deviceIdValue: unknown) {
  const deviceId = typeof deviceIdValue === "string" ? deviceIdValue : "";
  if (!/^[a-f0-9]{64}$/.test(deviceId)) throw new DeviceAccessError("Mã thiết bị không hợp lệ.", 400, "INVALID_DEVICE");
  const row = await rowFor(deviceId);
  if (!row) throw new DeviceAccessError("Không tìm thấy thiết bị.", 404, "DEVICE_NOT_FOUND");
  const nonce = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = Date.now() + 2 * 60 * 1000;
  const database = await getCourseDatabase();
  await database.batch([
    database.prepare("DELETE FROM site_access_challenges WHERE expires_at < ?").bind(Date.now()),
    database.prepare("DELETE FROM site_access_challenges WHERE device_id = ?").bind(deviceId),
    database.prepare("INSERT INTO site_access_challenges (nonce, device_id, expires_at) VALUES (?, ?, ?)").bind(nonce, deviceId, expiresAt),
  ]);
  return { challenge: nonce, expiresAt, device: state(row) };
}

export async function verifySiteDeviceProof(payload: Record<string, unknown>, previewRequest = false) {
  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : "";
  const challenge = typeof payload.challenge === "string" ? payload.challenge : "";
  const signature = typeof payload.signature === "string" ? payload.signature : "";
  if (!/^[a-f0-9]{64}$/.test(deviceId) || !/^[A-Za-z0-9_-]{40,100}$/.test(challenge)) {
    throw new DeviceAccessError("Bằng chứng thiết bị không hợp lệ.", 400, "INVALID_DEVICE_PROOF");
  }
  const row = await rowFor(deviceId);
  if (!row) throw new DeviceAccessError("Thiết bị chưa được đăng ký.", 404, "DEVICE_NOT_FOUND");
  if (!previewRequest && row.status !== "approved") {
    const current = state(row);
    throw new DeviceAccessError(row.status === "blocked" ? "Thiết bị này đã bị khóa." : "Thiết bị đang chờ Trung tâm cấp quyền.", 403, row.status === "blocked" ? "DEVICE_BLOCKED" : "DEVICE_PENDING", current);
  }
  const database = await getCourseDatabase();
  const proof = await database.prepare(
    "SELECT expires_at FROM site_access_challenges WHERE nonce = ? AND device_id = ?",
  ).bind(challenge, deviceId).first<{ expires_at: number }>();
  await database.prepare("DELETE FROM site_access_challenges WHERE nonce = ? AND device_id = ?").bind(challenge, deviceId).run();
  if (!proof || proof.expires_at < Date.now()) throw new DeviceAccessError("Phiên xác thực thiết bị đã hết hạn.", 401, "DEVICE_PROOF_EXPIRED", state(row));
  const key = await crypto.subtle.importKey("jwk", publicKeyShape(JSON.parse(row.public_key_jwk)), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const message = new TextEncoder().encode(`child-health-device:${deviceId}:${challenge}`);
  const valid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, fromBase64Url(signature), message);
  if (!valid) throw new DeviceAccessError("Thiết bị không khớp khóa truy cập.", 403, "DEVICE_MISMATCH", state(row));
  const policy = await getSiteAccessPolicy();
  if (!previewRequest && !policy.accessEnabled) {
    throw new DeviceAccessError("Sức khỏe Y tế đang tạm dừng truy cập theo chính sách của Trung tâm Quản trị.", 423, "APPLICATION_ACCESS_DISABLED", state(row));
  }
  await database.prepare(
    "UPDATE site_access_devices SET last_seen_at = CURRENT_TIMESTAMP, last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?",
  ).bind(deviceId).run();
  const updated = await rowFor(deviceId);
  return state(updated ?? row);
}

export async function createSiteAccessSession(deviceId: string) {
  if (!/^[a-f0-9]{64}$/.test(deviceId)) throw new DeviceAccessError("Mã thiết bị không hợp lệ.", 400, "INVALID_DEVICE");
  const device = await rowFor(deviceId);
  if (!device) throw new DeviceAccessError("Không tìm thấy thiết bị.", 404, "DEVICE_NOT_FOUND");
  const policy = await getSiteAccessPolicy();
  const database = await getCourseDatabase();
  const now = Date.now();
  await database.prepare("UPDATE site_access_sessions SET status = 'expired' WHERE status = 'active' AND expires_at <= ?").bind(now).run();
  const sessionId = base64Url(crypto.getRandomValues(new Uint8Array(24)));
  const expiresAt = now + policy.sessionTtlMinutes * 60_000;
  await database.prepare(
    `INSERT INTO site_access_sessions (session_id, device_id, status, expires_at)
     VALUES (?, ?, 'active', ?)`,
  ).bind(sessionId, deviceId, expiresAt).run();
  await auditHealthControlEvent("system", "site_session_started", sessionId, { deviceId, deviceCode: device.display_code, expiresAt });
  return { sessionId, deviceId, status: "active" as const, startedAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), expiresAt };
}

export async function touchSiteAccessSession(deviceId: string, sessionIdValue: unknown) {
  const sessionId = typeof sessionIdValue === "string" ? sessionIdValue : "";
  if (!/^[A-Za-z0-9_-]{24,80}$/.test(sessionId)) throw new DeviceAccessError("Phiên truy cập không hợp lệ.", 401, "ACCESS_SESSION_INVALID");
  const database = await getCourseDatabase();
  const row = await database.prepare(
    `SELECT session_id, device_id, status, expires_at FROM site_access_sessions WHERE session_id = ?`,
  ).bind(sessionId).first<{ session_id: string; device_id: string; status: string; expires_at: number }>();
  if (!row || row.device_id !== deviceId) throw new DeviceAccessError("Phiên truy cập không thuộc thiết bị này.", 401, "ACCESS_SESSION_MISMATCH");
  if (row.status === "revoked") throw new DeviceAccessError("Phiên truy cập đã bị Trung tâm thu hồi.", 401, "ACCESS_SESSION_REVOKED");
  if (row.status !== "active" || row.expires_at <= Date.now()) {
    await database.prepare("UPDATE site_access_sessions SET status = 'expired' WHERE session_id = ? AND status = 'active'").bind(sessionId).run();
    throw new DeviceAccessError("Phiên truy cập đã hết hạn.", 401, "ACCESS_SESSION_EXPIRED");
  }
  await database.prepare("UPDATE site_access_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE session_id = ?").bind(sessionId).run();
  return { sessionId, deviceId, status: "active" as const, expiresAt: row.expires_at };
}

export async function revokeSiteAccessSession(sessionIdValue: unknown, actor: string, reason = "Thu hồi từ Trung tâm Quản trị") {
  const sessionId = typeof sessionIdValue === "string" ? sessionIdValue : "";
  if (!/^[A-Za-z0-9_-]{24,80}$/.test(sessionId)) throw new DeviceAccessError("Mã phiên truy cập không hợp lệ.", 400, "INVALID_ACCESS_SESSION");
  const database = await getCourseDatabase();
  const existing = await database.prepare("SELECT device_id FROM site_access_sessions WHERE session_id = ?").bind(sessionId).first<{ device_id: string }>();
  if (!existing) throw new DeviceAccessError("Không tìm thấy phiên truy cập.", 404, "ACCESS_SESSION_NOT_FOUND");
  await database.prepare(
    `UPDATE site_access_sessions SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, revoked_by = ?, revoke_reason = ?
      WHERE session_id = ? AND status = 'active'`,
  ).bind(actor.trim().slice(0, 160) || "system", reason.trim().slice(0, 240), sessionId).run();
  await auditHealthControlEvent(actor, "site_session_revoked", sessionId, { deviceId: existing.device_id, reason });
}

export async function revokeSiteSessionsForDevice(deviceId: string, actor: string, reason = "Thu hồi quyền thiết bị") {
  const database = await getCourseDatabase();
  await database.prepare(
    `UPDATE site_access_sessions SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, revoked_by = ?, revoke_reason = ?
      WHERE device_id = ? AND status = 'active'`,
  ).bind(actor.trim().slice(0, 160) || "system", reason.trim().slice(0, 240), deviceId).run();
  await auditHealthControlEvent(actor, "site_device_sessions_revoked", deviceId, { reason });
}

export async function listSiteAccessSessions(limit = 200) {
  const policy = await getSiteAccessPolicy();
  const database = await getCourseDatabase();
  const now = Date.now();
  await database.prepare("UPDATE site_access_sessions SET status = 'expired' WHERE status = 'active' AND expires_at <= ?").bind(now).run();
  const rows = await database.prepare(
    `SELECT s.session_id, s.device_id, d.display_code, d.label, d.device_type, d.status AS device_status,
            s.status, s.started_at, s.last_seen_at, s.expires_at, s.revoked_at, s.revoked_by, s.revoke_reason
       FROM site_access_sessions s JOIN site_access_devices d ON d.device_id = s.device_id
      ORDER BY s.started_at DESC LIMIT ?`,
  ).bind(Math.max(1, Math.min(500, limit))).all<SessionRow>();
  return rows.results.map((row): SiteAccessSession => {
    const lastSeen = Date.parse(row.last_seen_at);
    const active = row.status === "active"
      && row.device_status === "approved"
      && row.expires_at > now
      && Number.isFinite(lastSeen)
      && now - lastSeen <= policy.sessionTimeoutSeconds * 1000;
    return {
      sessionId: row.session_id,
      deviceId: row.device_id,
      deviceCode: row.display_code,
      deviceLabel: row.label,
      deviceType: row.device_type,
      deviceStatus: row.device_status,
      status: row.status,
      startedAt: row.started_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      revokedBy: row.revoked_by,
      revokeReason: row.revoke_reason,
      active,
    };
  });
}

export async function auditHealthControlEvent(actor: string, action: string, target: string, detail: Record<string, unknown> = {}) {
  const database = await getCourseDatabase();
  await database.prepare("INSERT INTO course_audit_log (actor, action, target, detail_json) VALUES (?, ?, ?, ?)")
    .bind(actor.trim().slice(0, 160) || "system", action.slice(0, 120), target.slice(0, 200), JSON.stringify({ application: "child-health", ...detail })).run();
}

export async function listHealthControlAudit(limit = 150) {
  const database = await getCourseDatabase();
  const rows = await database.prepare(
    `SELECT id, actor, action, target, detail_json, created_at
       FROM course_audit_log ORDER BY id DESC LIMIT ?`,
  ).bind(Math.max(1, Math.min(300, limit))).all<{ id: number; actor: string; action: string; target: string; detail_json: string; created_at: string }>();
  return rows.results.map((row) => {
    let detail: Record<string, unknown> = {};
    try { detail = JSON.parse(row.detail_json) as Record<string, unknown>; } catch { detail = {}; }
    return { id: `health-${row.id}`, actor: row.actor, action: row.action, target: row.target, detail, createdAt: row.created_at };
  });
}

export async function getHealthControlStatus() {
  const database = await getCourseDatabase();
  const policy = await getSiteAccessPolicy();
  const now = Date.now();
  await database.prepare("UPDATE site_access_sessions SET status = 'expired' WHERE status = 'active' AND expires_at <= ?").bind(now).run();
  const deviceCounts = await database.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) AS blocked
       FROM site_access_devices`,
  ).first<{ total: number; pending: number; approved: number; blocked: number }>();
  const sessionCounts = await database.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'active' AND expires_at > ? THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) AS revoked,
            SUM(CASE WHEN status = 'expired' OR expires_at <= ? THEN 1 ELSE 0 END) AS expired
       FROM site_access_sessions`,
  ).bind(now, now).first<{ total: number; active: number; revoked: number; expired: number }>();
  return {
    application: "child-health" as const,
    contractVersion: 2,
    service: policy.accessEnabled ? "online" as const : "paused" as const,
    serverTime: new Date().toISOString(),
    devices: {
      total: Number(deviceCounts?.total ?? 0),
      pending: Number(deviceCounts?.pending ?? 0),
      approved: Number(deviceCounts?.approved ?? 0),
      blocked: Number(deviceCounts?.blocked ?? 0),
    },
    sessions: {
      total: Number(sessionCounts?.total ?? 0),
      active: Number(sessionCounts?.active ?? 0),
      revoked: Number(sessionCounts?.revoked ?? 0),
      expired: Number(sessionCounts?.expired ?? 0),
    },
    policy,
  };
}

export function deviceErrorResponse(error: unknown) {
  if (error instanceof DeviceAccessError) {
    return Response.json({ error: error.message, code: error.code, device: error.device }, { status: error.status, headers: { "cache-control": "no-store, private", "x-content-type-options": "nosniff" } });
  }
  return Response.json({ error: "Dịch vụ Sức khỏe Y tế đang tạm gián đoạn.", code: "HEALTH_SERVICE_ERROR" }, { status: 500, headers: { "cache-control": "no-store, private", "x-content-type-options": "nosniff" } });
}
