from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"pattern not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))


# Client enrollment: stable installation id + privacy-minimized runtime metadata.
replace_once(
    "app/suc-khoe-tre/device-gate.tsx",
    'type Credential = { version: 1; privateKey: CryptoKey | null; publicKey: JsonWebKey };',
    'type Credential = { version: 1; privateKey: CryptoKey | null; publicKey: JsonWebKey; installationId: string };',
)

replace_once(
    "app/suc-khoe-tre/device-gate.tsx",
    '''async function credentialForDevice() {
  const current = await readCredential();
  if (current?.version === 1 && current.publicKey && current.privateKey) return current;
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const privateKey = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const credential = { version: 1, privateKey, publicKey } satisfies Credential;
  await writeCredential(credential);
  return credential;
}''',
    '''async function credentialForDevice() {
  const current = await readCredential();
  if (current?.version === 1 && current.publicKey && current.privateKey) {
    if (current.installationId) return current;
    const upgraded = { ...current, installationId: crypto.randomUUID() } satisfies Credential;
    await writeCredential(upgraded);
    return upgraded;
  }
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const privateKey = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const credential = { version: 1, privateKey, publicKey, installationId: crypto.randomUUID() } satisfies Credential;
  await writeCredential(credential);
  return credential;
}''',
)

replace_once(
    "app/suc-khoe-tre/device-gate.tsx",
    '''function deviceMetadata() {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean; platform?: string } };
  return {
    userAgent: navigator.userAgent,
    platform: nav.userAgentData?.platform || navigator.platform || "",
    mobile: nav.userAgentData?.mobile === true,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
}''',
    '''async function deviceMetadata(installationId: string) {
  const nav = navigator as Navigator & {
    userAgentData?: {
      mobile?: boolean;
      platform?: string;
      getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
    };
    standalone?: boolean;
  };
  let highEntropy: Record<string, unknown> = {};
  try {
    highEntropy = await nav.userAgentData?.getHighEntropyValues?.(["platformVersion", "model", "architecture", "bitness"]) ?? {};
  } catch {
    highEntropy = {};
  }
  const pwaMode = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  return {
    installationId,
    userAgent: navigator.userAgent,
    platform: nav.userAgentData?.platform || navigator.platform || "",
    platformVersion: typeof highEntropy.platformVersion === "string" ? highEntropy.platformVersion : "",
    model: typeof highEntropy.model === "string" ? highEntropy.model : "",
    architecture: typeof highEntropy.architecture === "string" ? highEntropy.architecture : "",
    bitness: typeof highEntropy.bitness === "string" ? highEntropy.bitness : "",
    mobile: nav.userAgentData?.mobile === true,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    pwaMode,
    language: navigator.language || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  };
}''',
)

replace_once(
    "app/suc-khoe-tre/device-gate.tsx",
    'const data = await api("/api/device", { action: "register", publicKey: credential.publicKey, metadata: deviceMetadata() });',
    'const data = await api("/api/device", { action: "register", publicKey: credential.publicKey, metadata: await deviceMetadata(credential.installationId) });',
)

# Server-side authoritative classifier.
replace_once(
    "app/device-auth.server.ts",
    'export type SiteDeviceType = "desktop" | "phone" | "tablet";\n',
    'export type SiteDeviceType = "desktop" | "phone" | "tablet";\nexport type SiteDeviceClassificationConfidence = "high" | "medium" | "low";\n',
)

replace_once(
    "app/device-auth.server.ts",
    '''  platform: string | null;
  browser: string | null;
  label: string | null;''',
    '''  platform: string | null;
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
  label: string | null;''',
)

replace_once(
    "app/device-auth.server.ts",
    '''  screen_width: number | null;
  screen_height: number | null;
  label: string | null;''',
    '''  screen_width: number | null;
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
  label: string | null;''',
)

replace_once(
    "app/device-auth.server.ts",
    '''function classifyDevice(metadata: Record<string, unknown>): SiteDeviceType {
  const ua = cleanText(metadata.userAgent, 500).toLowerCase();
  const platform = cleanText(metadata.platform, 80).toLowerCase();
  const mobileHint = metadata.mobile === true;
  const touchPoints = Math.max(0, Math.min(20, Number(metadata.maxTouchPoints) || 0));
  const ipad = ua.includes("ipad") || (platform.includes("mac") && touchPoints > 1);
  if (ipad || ua.includes("tablet") || (ua.includes("android") && !ua.includes("mobile"))) return "tablet";
  if (mobileHint || ua.includes("iphone") || ua.includes("ipod") || ua.includes("mobile") || /android.+mobile/.test(ua)) return "phone";
  return "desktop";
}

function detectBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("crios/") || ua.includes("chrome/")) return "Chrome";
  if (ua.includes("fxios/") || ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  return "Khác";
}''',
    '''function classifyDevice(metadata: Record<string, unknown>): { type: SiteDeviceType; confidence: SiteDeviceClassificationConfidence; reason: string } {
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
    ["Edge", /edg(?:a|ios)?\\/([0-9.]+)/i],
    ["Chrome", /(?:chrome|crios)\\/([0-9.]+)/i],
    ["Firefox", /(?:firefox|fxios)\\/([0-9.]+)/i],
    ["Safari", /version\\/([0-9.]+).*safari/i],
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
}''',
)

replace_once(
    "app/device-auth.server.ts",
    '''    platform: row.platform,
    browser: row.browser,
    label: row.label,''',
    '''    platform: row.platform,
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
    label: row.label,''',
)

replace_once(
    "app/device-auth.server.ts",
    '''    `SELECT device_id, display_code, public_key_jwk, status, device_type, platform, browser,
            user_agent, screen_width, screen_height, label, edit_enabled, calendar_enabled, created_at,
            approved_at, blocked_at, last_seen_at, last_activity_at
       FROM site_access_devices WHERE device_id = ?`,''',
    '''    `SELECT device_id, display_code, public_key_jwk, status, device_type, platform, browser,
            user_agent, screen_width, screen_height, installation_id, os_name, browser_version,
            mobile_hint, touch_points, viewport_width, viewport_height, pixel_ratio, pwa_mode, language,
            timezone, classification_confidence, classification_reason, metadata_updated_at,
            label, edit_enabled, calendar_enabled, created_at, approved_at, blocked_at, last_seen_at, last_activity_at
       FROM site_access_devices WHERE device_id = ?`,''',
)

old_register = '''export async function registerSiteDevice(publicKey: unknown, metadataValue: unknown, autoApprove = false) {
  const key = publicKeyShape(publicKey);
  const serialized = canonicalKey(key);
  const deviceId = await sha256(serialized);
  const metadata = metadataValue && typeof metadataValue === "object" ? metadataValue as Record<string, unknown> : {};
  const userAgent = cleanText(metadata.userAgent, 500);
  const platform = cleanText(metadata.platform, 80) || null;
  const browser = detectBrowser(userAgent);
  const deviceType = classifyDevice(metadata);
  const screenWidth = Math.max(0, Math.min(10000, Math.round(Number(metadata.screenWidth) || 0))) || null;
  const screenHeight = Math.max(0, Math.min(10000, Math.round(Number(metadata.screenHeight) || 0))) || null;
  const database = await getCourseDatabase();
  const existing = await rowFor(deviceId);
  if (existing) {
    await database.prepare(
      `UPDATE site_access_devices SET device_type = ?, platform = ?, browser = ?, user_agent = ?,
              screen_width = ?, screen_height = ?, last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE device_id = ?`,
    ).bind(deviceType, platform, browser, userAgent || null, screenWidth, screenHeight, deviceId).run();
    const updated = await rowFor(deviceId);
    return state(updated ?? existing);
  }
  const status: SiteDeviceStatus = autoApprove ? "approved" : "pending";
  await database.prepare(
    `INSERT INTO site_access_devices
      (device_id, display_code, public_key_jwk, status, device_type, platform, browser, user_agent,
       screen_width, screen_height, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${autoApprove ? "CURRENT_TIMESTAMP" : "NULL"})`,
  ).bind(deviceId, displayCodeFor(deviceId), serialized, status, deviceType, platform, browser, userAgent || null, screenWidth, screenHeight).run();
  const created = await rowFor(deviceId);
  if (!created) throw new DeviceAccessError("Không thể đăng ký thiết bị Sức khỏe Y tế.", 500, "DEVICE_CREATE_FAILED");
  await auditHealthControlEvent("system", "site_device_registered", deviceId, { deviceCode: created.display_code, deviceType, platform, browser });
  return state(created);
}'''

new_register = '''export async function registerSiteDevice(publicKey: unknown, metadataValue: unknown, autoApprove = false) {
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
}'''
replace_once("app/device-auth.server.ts", old_register, new_register)

# Control API returns the classifier result and supporting metadata to Admin.
replace_once(
    "app/api/control/devices/route.ts",
    '''  platform: string | null;
  browser: string | null;
  screen_width: number | null;
  screen_height: number | null;
  label: string | null;''',
    '''  platform: string | null;
  os_name: string | null;
  browser: string | null;
  browser_version: string | null;
  installation_id: string | null;
  screen_width: number | null;
  screen_height: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  touch_points: number;
  mobile_hint: number;
  pwa_mode: number;
  language: string | null;
  timezone: string | null;
  classification_confidence: "high" | "medium" | "low";
  classification_reason: string | null;
  metadata_updated_at: string;
  label: string | null;''',
)

replace_once(
    "app/api/control/devices/route.ts",
    '''    platform: row.platform,
    browser: row.browser,
    screenWidth: row.screen_width,
    screenHeight: row.screen_height,
    label: row.label,''',
    '''    platform: row.platform,
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
    metadataUpdatedAt: row.metadata_updated_at,
    label: row.label,''',
)

replace_once(
    "app/api/control/devices/route.ts",
    '''    `SELECT device_id, display_code, status, device_type, platform, browser, screen_width,
            screen_height, label, edit_enabled, calendar_enabled, created_at, approved_at, blocked_at,
            last_seen_at, last_activity_at
       FROM site_access_devices''',
    '''    `SELECT device_id, display_code, status, device_type, platform, os_name, browser, browser_version,
            installation_id, screen_width, screen_height, viewport_width, viewport_height, touch_points, mobile_hint,
            pwa_mode, language, timezone, classification_confidence, classification_reason, metadata_updated_at,
            label, edit_enabled, calendar_enabled, created_at, approved_at, blocked_at, last_seen_at, last_activity_at
       FROM site_access_devices''',
)

print("Device classifier V2 patch applied.")
