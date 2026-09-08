from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"pattern not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))

path = "app/device-auth.server.ts"

replace_once(
    path,
    '''  status: SiteDeviceStatus;\n  deviceType: SiteDeviceType;\n  platform: string | null;''',
    '''  status: SiteDeviceStatus;\n  deviceType: SiteDeviceType;\n  detectedDeviceType: SiteDeviceType;\n  deviceTypeOverride: SiteDeviceType | null;\n  deviceTypeOverrideBy: string | null;\n  deviceTypeOverrideAt: string | null;\n  environmentChanged: boolean;\n  environmentChangeReason: string | null;\n  platform: string | null;''',
)

replace_once(
    path,
    '''  status: SiteDeviceStatus;\n  device_type: SiteDeviceType;\n  platform: string | null;''',
    '''  status: SiteDeviceStatus;\n  device_type: SiteDeviceType;\n  detected_device_type: SiteDeviceType;\n  device_type_override: SiteDeviceType | null;\n  device_type_override_by: string | null;\n  device_type_override_at: string | null;\n  environment_changed: number;\n  environment_change_reason: string | null;\n  platform: string | null;''',
)

replace_once(
    path,
    '''    status: row.status,\n    deviceType: row.device_type,\n    platform: row.platform,''',
    '''    status: row.status,\n    deviceType: row.device_type,\n    detectedDeviceType: row.detected_device_type,\n    deviceTypeOverride: row.device_type_override,\n    deviceTypeOverrideBy: row.device_type_override_by,\n    deviceTypeOverrideAt: row.device_type_override_at,\n    environmentChanged: row.environment_changed === 1,\n    environmentChangeReason: row.environment_change_reason,\n    platform: row.platform,''',
)

replace_once(
    path,
    '''    `SELECT device_id, display_code, public_key_jwk, status, device_type, platform, browser,\n            user_agent, screen_width, screen_height, installation_id, os_name, browser_version,''',
    '''    `SELECT device_id, display_code, public_key_jwk, status, device_type, detected_device_type,\n            device_type_override, device_type_override_by, device_type_override_at, environment_changed,\n            environment_change_reason, platform, browser, user_agent, screen_width, screen_height, installation_id,\n            os_name, browser_version,''',
)

old_existing = '''  const existing = await rowFor(deviceId);\n  if (existing) {\n    await database.prepare(\n      `UPDATE site_access_devices SET device_type = ?, platform = ?, os_name = ?, browser = ?, browser_version = ?,\n              user_agent = ?, installation_id = COALESCE(?, installation_id), screen_width = ?, screen_height = ?,\n              viewport_width = ?, viewport_height = ?, pixel_ratio = ?, mobile_hint = ?, touch_points = ?, pwa_mode = ?,\n              language = ?, timezone = ?, classification_confidence = ?, classification_reason = ?,\n              metadata_updated_at = CURRENT_TIMESTAMP, last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP\n        WHERE device_id = ?`,\n    ).bind(\n      classification.type, platform, osName, browserInfo.name, browserInfo.version, userAgent || null, installationId,\n      screenWidth, screenHeight, viewportWidth, viewportHeight, pixelRatio, mobileHint ? 1 : 0, touchPoints, pwaMode ? 1 : 0,\n      language, timezone, classification.confidence, classification.reason, deviceId,\n    ).run();\n    const updated = await rowFor(deviceId);\n    return state(updated ?? existing);\n  }'''
new_existing = '''  const existing = await rowFor(deviceId);\n  if (existing) {\n    const environmentReasons: string[] = [];\n    const previousDetected = existing.detected_device_type || existing.device_type;\n    if (previousDetected !== classification.type) environmentReasons.push(`Loại tự động đổi ${previousDetected} → ${classification.type}`);\n    if (existing.os_name && osName && existing.os_name !== osName) environmentReasons.push(`Hệ điều hành đổi ${existing.os_name} → ${osName}`);\n    if (existing.installation_id && installationId && existing.installation_id !== installationId) environmentReasons.push("Installation ID thay đổi");\n    const environmentChanged = environmentReasons.length > 0;\n    const environmentReason = environmentReasons.join("; ").slice(0, 280) || null;\n    await database.prepare(\n      `UPDATE site_access_devices SET detected_device_type = ?,\n              device_type = CASE WHEN device_type_override IS NULL THEN ? ELSE device_type END,\n              platform = ?, os_name = ?, browser = ?, browser_version = ?,\n              user_agent = ?, installation_id = COALESCE(?, installation_id), screen_width = ?, screen_height = ?,\n              viewport_width = ?, viewport_height = ?, pixel_ratio = ?, mobile_hint = ?, touch_points = ?, pwa_mode = ?,\n              language = ?, timezone = ?, classification_confidence = ?, classification_reason = ?,\n              environment_changed = CASE WHEN ? = 1 THEN 1 ELSE environment_changed END,\n              environment_change_reason = CASE WHEN ? = 1 THEN ? ELSE environment_change_reason END,\n              metadata_updated_at = CURRENT_TIMESTAMP, last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP\n        WHERE device_id = ?`,\n    ).bind(\n      classification.type, classification.type, platform, osName, browserInfo.name, browserInfo.version, userAgent || null, installationId,\n      screenWidth, screenHeight, viewportWidth, viewportHeight, pixelRatio, mobileHint ? 1 : 0, touchPoints, pwaMode ? 1 : 0,\n      language, timezone, classification.confidence, classification.reason, environmentChanged ? 1 : 0,\n      environmentChanged ? 1 : 0, environmentReason, deviceId,\n    ).run();\n    if (environmentChanged) {\n      await auditHealthControlEvent("system", "site_device_environment_changed", deviceId, {\n        deviceCode: existing.display_code,\n        previousDetectedDeviceType: previousDetected,\n        detectedDeviceType: classification.type,\n        reason: environmentReason,\n      });\n    }\n    const updated = await rowFor(deviceId);\n    return state(updated ?? existing);\n  }'''
replace_once(path, old_existing, new_existing)

replace_once(
    path,
    '''      (device_id, display_code, public_key_jwk, status, device_type, platform, os_name, browser, browser_version,\n       user_agent, installation_id, screen_width, screen_height, viewport_width, viewport_height, pixel_ratio,''',
    '''      (device_id, display_code, public_key_jwk, status, device_type, detected_device_type, platform, os_name, browser, browser_version,\n       user_agent, installation_id, screen_width, screen_height, viewport_width, viewport_height, pixel_ratio,''',
)

replace_once(
    path,
    '''     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${autoApprove ? "CURRENT_TIMESTAMP" : "NULL"})`,\n  ).bind(\n    deviceId, displayCodeFor(deviceId), serialized, status, classification.type, platform, osName, browserInfo.name,''',
    '''     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${autoApprove ? "CURRENT_TIMESTAMP" : "NULL"})`,\n  ).bind(\n    deviceId, displayCodeFor(deviceId), serialized, status, classification.type, classification.type, platform, osName, browserInfo.name,''',
)

print("device management review patch applied")
