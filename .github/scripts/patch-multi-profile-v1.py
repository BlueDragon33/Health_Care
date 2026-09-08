from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

# Remove global single-profile runtime IO from framework imports.
text = text.replace('  loadHealthState,\n', '', 1)
text = text.replace('  saveHealthState,\n', '', 1)

# Add registry imports.
anchor = 'import AttentionQueue from "./attention-queue";\n'
if anchor not in text:
    raise SystemExit("AttentionQueue import anchor not found")
registry_imports = '''import ProfileSwitcher from "./profile-switcher";\nimport type { HealthProfileRegistry } from "./health-profile-contracts";\nimport {\n  createHealthProfile,\n  deleteHealthProfile,\n  loadHealthProfileRegistry,\n  loadHealthProfileState,\n  saveHealthProfileRegistry,\n  saveHealthProfileState,\n  setActiveHealthProfile,\n  syncRegistryIdentity,\n} from "./health-profile-registry";\n'''
if 'import ProfileSwitcher from "./profile-switcher";' not in text:
    text = text.replace(anchor, anchor + registry_imports, 1)

# Registry state.
state_anchor = '  const [state, setState] = useState<HealthLocalState>(() => createInitialHealthState());\n'
if state_anchor not in text:
    raise SystemExit("state anchor not found")
if 'const [profileRegistry, setProfileRegistry]' not in text:
    text = text.replace(state_anchor, state_anchor + '  const [profileRegistry, setProfileRegistry] = useState<HealthProfileRegistry | null>(null);\n', 1)

# Replace hydration + global save effects.
old = '''  useEffect(() => {\n    const timer = window.setTimeout(() => {\n      const today = todayKey();\n      setState(loadHealthState());\n      setDayKey(today);\n      setGrowthDate(today);\n      setNotificationPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);\n      setHydrated(true);\n    }, 0);\n    return () => window.clearTimeout(timer);\n  }, []);\n\n  useEffect(() => {\n    if (!hydrated) return;\n    saveHealthState(state);\n  }, [hydrated, state]);\n'''
new = '''  useEffect(() => {\n    const timer = window.setTimeout(() => {\n      const today = todayKey();\n      const registry = loadHealthProfileRegistry();\n      const activeId = registry.activeProfileId ?? registry.profiles[0]?.id;\n      const identity = registry.profiles.find((item) => item.id === activeId);\n      setProfileRegistry(registry);\n      setState(activeId ? loadHealthProfileState(activeId, identity) : createInitialHealthState());\n      setDayKey(today);\n      setGrowthDate(today);\n      setNotificationPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);\n      setHydrated(true);\n    }, 0);\n    return () => window.clearTimeout(timer);\n  }, []);\n\n  useEffect(() => {\n    if (!hydrated || !profileRegistry?.activeProfileId) return;\n    const activeId = profileRegistry.activeProfileId;\n    saveHealthProfileState(activeId, state);\n    const synced = syncRegistryIdentity(profileRegistry, activeId, state.profile);\n    if (synced !== profileRegistry) {\n      saveHealthProfileRegistry(synced);\n      setProfileRegistry(synced);\n    }\n  }, [hydrated, profileRegistry, state]);\n'''
if old not in text:
    raise SystemExit("hydration/save effect block not found")
text = text.replace(old, new, 1)

# Add profile ID + handlers after nextReminder memo block.
insert_anchor = '''  const nextReminder = useMemo(() => {\n    const candidates = state.reminders.map((reminder) => ({ reminder, date: nextReminderOccurrence(reminder) })).filter((item): item is { reminder: Reminder; date: Date } => item.date !== null);\n    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());\n    return candidates[0] ?? null;\n  }, [state.reminders]);\n'''
if insert_anchor not in text:
    raise SystemExit("nextReminder anchor not found")
handlers = '''\n  const activeProfileId = profileRegistry?.activeProfileId ?? "";\n  const activeProfileIdentity = profileRegistry?.profiles.find((item) => item.id === activeProfileId) ?? null;\n\n  function switchProfile(profileId: string) {\n    if (!profileRegistry || !profileId || profileId === activeProfileId) return;\n    if (activeProfileId) saveHealthProfileState(activeProfileId, state);\n    const nextRegistry = setActiveHealthProfile(profileRegistry, profileId);\n    const identity = nextRegistry.profiles.find((item) => item.id === profileId);\n    saveHealthProfileRegistry(nextRegistry);\n    setProfileRegistry(nextRegistry);\n    setState(loadHealthProfileState(profileId, identity));\n    const currentToday = todayKey();\n    setDayKey(currentToday);\n    setGrowthDate(currentToday);\n    setBackupNotice("");\n  }\n\n  function createProfile(displayName: string) {\n    if (!profileRegistry) return;\n    if (activeProfileId) saveHealthProfileState(activeProfileId, state);\n    const created = createHealthProfile(profileRegistry, displayName);\n    if (!created) {\n      setBackupNotice("Đã đạt giới hạn hồ sơ trên thiết bị này.");\n      return;\n    }\n    setProfileRegistry(created.registry);\n    setState(created.state);\n    const currentToday = todayKey();\n    setDayKey(currentToday);\n    setGrowthDate(currentToday);\n    setBackupNotice(`Đã tạo hồ sơ riêng “${created.state.profile.name}”.`);\n  }\n\n  function removeProfile(profileId: string) {\n    if (!profileRegistry) return;\n    const wasActive = profileId === activeProfileId;\n    const nextRegistry = deleteHealthProfile(profileRegistry, profileId);\n    if (!nextRegistry) return;\n    setProfileRegistry(nextRegistry);\n    if (wasActive && nextRegistry.activeProfileId) {\n      const identity = nextRegistry.profiles.find((item) => item.id === nextRegistry.activeProfileId);\n      setState(loadHealthProfileState(nextRegistry.activeProfileId, identity));\n      const currentToday = todayKey();\n      setDayKey(currentToday);\n      setGrowthDate(currentToday);\n    }\n    setBackupNotice("Đã xóa hồ sơ được chọn trên thiết bị. Các hồ sơ khác không bị thay đổi.");\n  }\n'''
if 'function switchProfile(profileId: string)' not in text:
    text = text.replace(insert_anchor, insert_anchor + handlers, 1)

# Profile-scoped backup naming/copy.
old_download = '''  function downloadBackup() {\n    const content = exportHealthBackup(state);\n    const blob = new Blob([content], { type: "application/json;charset=utf-8" });\n    const url = URL.createObjectURL(blob);\n    const anchor = document.createElement("a");\n    anchor.href = url;\n    anchor.download = `suc-khoe-y-te-9-18-backup-${today}.json`;\n    document.body.appendChild(anchor);\n    anchor.click();\n    anchor.remove();\n    URL.revokeObjectURL(url);\n    setBackupNotice("Đã tạo bản sao dữ liệu cục bộ 9–18 tuổi. Hãy lưu tệp ở nơi an toàn.");\n  }\n'''
new_download = '''  function downloadBackup() {\n    const content = exportHealthBackup(state);\n    const blob = new Blob([content], { type: "application/json;charset=utf-8" });\n    const url = URL.createObjectURL(blob);\n    const anchor = document.createElement("a");\n    const profileSlug = (activeProfileIdentity?.displayName || "ho-so").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "ho-so";\n    anchor.href = url;\n    anchor.download = `suc-khoe-y-te-${profileSlug}-backup-${today}.json`;\n    document.body.appendChild(anchor);\n    anchor.click();\n    anchor.remove();\n    URL.revokeObjectURL(url);\n    setBackupNotice(`Đã tạo bản sao riêng cho hồ sơ “${activeProfileIdentity?.displayName ?? state.profile.name || "đang chọn"}”.`);\n  }\n'''
if old_download not in text:
    raise SystemExit("downloadBackup block not found")
text = text.replace(old_download, new_download, 1)

text = text.replace(
    '      setBackupNotice("Đã khôi phục bản sao. Bản sao 9–10 cũ cũng được hỗ trợ và tự di trú.");',
    '      setBackupNotice("Đã khôi phục bản sao vào riêng hồ sơ đang chọn. Hồ sơ khác không bị thay đổi; bản sao 9–10 cũ vẫn được hỗ trợ.");',
    1,
)

# Global profile switcher after topbar.
topbar = '        <div className="hf-topbar"><div><span className="hf-kicker">Theo dõi xuyên suốt · 9 đến hết 18 tuổi</span><h1>Sức khỏe Y tế 9–18 tuổi</h1><small>{profileAge.stage?.label ?? "Nhập ngày sinh để xác định giai đoạn phát triển"}</small></div><div className="hf-top-status"><span className="hf-dot" />{contentReady ? `${device.deviceCode} · đã cấp truy cập` : "Đang chờ nội dung"}</div></div>\n'
switcher = '        {profileRegistry ? <ProfileSwitcher registry={profileRegistry} onSwitch={switchProfile} onCreate={createProfile} onDelete={removeProfile} /> : null}\n'
if topbar not in text:
    raise SystemExit("topbar anchor not found")
if '<ProfileSwitcher registry={profileRegistry}' not in text:
    text = text.replace(topbar, topbar + switcher, 1)

# Attention items carry active profile identity.
text = text.replace(
    '<AttentionQueue state={state} onNavigate={(target) => setActive(target)} />',
    '{activeProfileId ? <AttentionQueue state={state} profileId={activeProfileId} onNavigate={(target) => setActive(target)} /> : null}',
    1,
)

# Clarify profile-scoped backup copy.
text = text.replace(
    '<p className="hf-muted">Bản 9–18 đọc được cả tệp sao lưu 9–10 cũ. Việc di trú chỉ sao chép sang khóa lưu trữ mới, không xóa dữ liệu cũ.</p>',
    '<p className="hf-muted">Xuất/khôi phục mặc định chỉ tác động hồ sơ đang chọn. Bản 9–18 vẫn đọc được tệp sao lưu 9–10 cũ; dữ liệu legacy được giữ để rollback.</p>',
    1,
)

p.write_text(text)

# Page stylesheet.
p = Path("app/suc-khoe-tre/page.tsx")
text = p.read_text()
anchor = 'import "./attention-queue.css";\n'
if anchor not in text:
    raise SystemExit("attention-queue.css import not found")
if 'import "./profile-switcher.css";' not in text:
    text = text.replace(anchor, anchor + 'import "./profile-switcher.css";\n', 1)
p.write_text(text)

# Framework validator chain.
p = Path("package.json")
text = p.read_text()
old = 'node scripts/validate-attention-queue.mjs"'
new = 'node scripts/validate-attention-queue.mjs && node scripts/validate-profile-registry.mjs"'
if old not in text:
    raise SystemExit("validate framework tail not found")
text = text.replace(old, new, 1)
p.write_text(text)

# Update profile contract note: runtime V1 exists, record-level profileId is next deeper schema step.
p = Path("app/suc-khoe-tre/health-profile-contracts.ts")
text = p.read_text()
old = '''// Contract only. Local state hiện tại vẫn là single-profile baseline.\n// Khi migration sang multi-profile được triển khai phải giữ key cũ để rollback, tạo profileId cho dữ liệu hiện có,\n// kiểm thử không trộn dữ liệu giữa các con và không làm mất backup legacy.\n'''
new = '''// Runtime Profile Registry V1 đã tách state theo profileId/storage key và giữ legacy key để rollback.\n// Các record bên trong HealthLocalState chưa được nhúng profileId riêng ở V1; isolation hiện được đảm bảo bởi profile-scoped state.\n// Khi nâng schema record-level phải thêm profileId mà không phá backup legacy và tiếp tục test chống trộn dữ liệu.\n'''
if old not in text:
    raise SystemExit("profile contract legacy note not found")
text = text.replace(old, new, 1)
p.write_text(text)
