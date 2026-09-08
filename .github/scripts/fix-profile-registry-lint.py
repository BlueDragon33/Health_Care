from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

# HealthProfile type is needed for event-driven identity synchronization.
old = '  type HealthLocalState,\n  type MealEntry,'
new = '  type HealthLocalState,\n  type HealthProfile,\n  type MealEntry,'
if old not in text:
    raise SystemExit("HealthLocalState import anchor not found")
text = text.replace(old, new, 1)

# Put active profile identity before effects so persistence effects can depend on a scalar ID.
state_anchor = '  const [backupNotice, setBackupNotice] = useState("");\n'
insert = '''  const [backupNotice, setBackupNotice] = useState("");\n\n  const activeProfileId = profileRegistry?.activeProfileId ?? "";\n  const activeProfileIdentity = profileRegistry?.profiles.find((item) => item.id === activeProfileId) ?? null;\n'''
if state_anchor not in text:
    raise SystemExit("backupNotice state anchor not found")
text = text.replace(state_anchor, insert, 1)

# Replace effect that synchronously updates React state with persistence-only effects.
old_effect = '''  useEffect(() => {\n    if (!hydrated || !profileRegistry?.activeProfileId) return;\n    const activeId = profileRegistry.activeProfileId;\n    saveHealthProfileState(activeId, state);\n    const synced = syncRegistryIdentity(profileRegistry, activeId, state.profile);\n    if (synced !== profileRegistry) {\n      saveHealthProfileRegistry(synced);\n      setProfileRegistry(synced);\n    }\n  }, [hydrated, profileRegistry, state]);\n'''
new_effect = '''  useEffect(() => {\n    if (!hydrated || !activeProfileId) return;\n    saveHealthProfileState(activeProfileId, state);\n  }, [hydrated, activeProfileId, state]);\n\n  useEffect(() => {\n    if (!hydrated || !profileRegistry) return;\n    saveHealthProfileRegistry(profileRegistry);\n  }, [hydrated, profileRegistry]);\n'''
if old_effect not in text:
    raise SystemExit("profile persistence effect block not found")
text = text.replace(old_effect, new_effect, 1)

# Remove duplicate active profile declarations after reminder memo.
duplicate = '''\n  const activeProfileId = profileRegistry?.activeProfileId ?? "";\n  const activeProfileIdentity = profileRegistry?.profiles.find((item) => item.id === activeProfileId) ?? null;\n'''
if duplicate not in text:
    raise SystemExit("duplicate active profile declarations not found")
text = text.replace(duplicate, "", 1)

# Event-driven profile identity update; no setState in effect.
handler_anchor = '  function switchProfile(profileId: string) {\n'
handler = '''  function updateProfile(patch: Partial<HealthProfile>) {\n    const nextProfile = { ...state.profile, ...patch };\n    setState((current) => ({ ...current, profile: { ...current.profile, ...patch } }));\n    if (profileRegistry && activeProfileId) {\n      setProfileRegistry(syncRegistryIdentity(profileRegistry, activeProfileId, nextProfile));\n    }\n  }\n\n'''
if handler_anchor not in text:
    raise SystemExit("switchProfile anchor not found")
if 'function updateProfile(patch: Partial<HealthProfile>)' not in text:
    text = text.replace(handler_anchor, handler + handler_anchor, 1)

# Update imported backup identity immediately for the active profile.
old_import = '''      const imported = parseHealthBackup(JSON.parse(await file.text()));\n      setState(imported);\n      setDayKey(today);'''
new_import = '''      const imported = parseHealthBackup(JSON.parse(await file.text()));\n      setState(imported);\n      if (profileRegistry && activeProfileId) {\n        setProfileRegistry(syncRegistryIdentity(profileRegistry, activeProfileId, imported.profile));\n      }\n      setDayKey(today);'''
if old_import not in text:
    raise SystemExit("backup import anchor not found")
text = text.replace(old_import, new_import, 1)

# Profile form edits now update both profile state and registry identity from event handlers.
text = text.replace(
    'onChange={(event) => setState((current) => ({ ...current, profile: { ...current.profile, name: event.target.value } }))}',
    'onChange={(event) => updateProfile({ name: event.target.value })}',
    1,
)
text = text.replace(
    'onChange={(event) => setState((current) => ({ ...current, profile: { ...current.profile, birthDate: event.target.value } }))}',
    'onChange={(event) => updateProfile({ birthDate: event.target.value })}',
    1,
)
text = text.replace(
    'onChange={(event) => setState((current) => ({ ...current, profile: { ...current.profile, sex: event.target.value as "male" | "female" | "" } }))}',
    'onChange={(event) => updateProfile({ sex: event.target.value as "male" | "female" | "" })}',
    1,
)

p.write_text(text)

# Strengthen validator against the React anti-pattern that caused this gate failure.
p = Path("scripts/validate-profile-registry.mjs")
text = p.read_text()
anchor = 'if (/\\bsaveHealthState\\(/.test(framework)) throw new Error("Framework không được ghi global single-profile state sau migration");\n'
extra = '''if (/\\bsaveHealthState\\(/.test(framework)) throw new Error("Framework không được ghi global single-profile state sau migration");\nif (framework.includes("saveHealthProfileRegistry(synced);\\n      setProfileRegistry(synced);")) throw new Error("Không được set Profile Registry đồng bộ bên trong persistence effect");\nneed(framework, "function updateProfile(patch: Partial<HealthProfile>)", "event-driven profile identity sync");\nneed(framework, "setProfileRegistry(syncRegistryIdentity(profileRegistry, activeProfileId, nextProfile))", "registry sync from edit event");\n'''
if anchor not in text:
    raise SystemExit("validator saveHealthState anchor not found")
text = text.replace(anchor, extra, 1)
p.write_text(text)
