from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    text = p.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"Missing anchor for {label}")
    p.write_text(text.replace(old, new, 1))

replace_once(
    "app/suc-khoe-tre/health-framework.tsx",
    'import PreventiveCareRecords from "./preventive-care-records";\n',
    'import PreventiveCareRecords from "./preventive-care-records";\nimport SymptomEpisodeTracking from "./symptom-episode-tracking";\n',
    "framework import",
)

replace_once(
    "app/suc-khoe-tre/health-framework.tsx",
    'function Empty({ children }: { children: React.ReactNode }) {\n  return <div className="hf-empty">{children}</div>;\n}\n',
    'function Empty({ children }: { children: React.ReactNode }) {\n  return <div className="hf-empty">{children}</div>;\n}\n\nfunction HealthVaultBoundary({ profileId, children }: { profileId: string; children: React.ReactNode }) {\n  return profileId ? <SecureVaultSessionProvider key={`vault-session-${profileId}`} profileId={profileId}>{children}</SecureVaultSessionProvider> : <>{children}</>;\n}\n',
    "shared vault boundary helper",
)

framework_path = Path("app/suc-khoe-tre/health-framework.tsx")
framework = framework_path.read_text()
open_old = '      <section className="hf-content">\n'
open_new = '      <HealthVaultBoundary profileId={activeProfileId}>\n      <section className="hf-content">\n'
if open_new not in framework:
    if open_old not in framework:
        raise SystemExit("Missing anchor for hf-content open")
    framework = framework.replace(open_old, open_new, 1)

close_old = '      </section>\n    </div>\n\n    <nav className="hf-bottom-nav"'
close_new = '      </section>\n      </HealthVaultBoundary>\n    </div>\n\n    <nav className="hf-bottom-nav"'
if close_new not in framework:
    if close_old not in framework:
        raise SystemExit("Missing anchor for hf-content close")
    framework = framework.replace(close_old, close_new, 1)

inner_old = '''          {activeProfileId ? <SecureVaultSessionProvider key={`vault-session-${activeProfileId}`} profileId={activeProfileId}>\n            <PrivacyCenter profileId={activeProfileId} />\n            <SecureVaultCenter />\n            <SecureVaultBackupCenter />\n            <MedicationsAllergies />\n            <VitalSignsScreening />\n            <ChronicConditionsCarePlans />\n            <PreventiveCareRecords />\n            <PrivateSensitiveNotes />\n          </SecureVaultSessionProvider> : null}'''
inner_new = '''          {activeProfileId ? <>\n            <PrivacyCenter profileId={activeProfileId} />\n            <SecureVaultCenter />\n            <SecureVaultBackupCenter />\n            <MedicationsAllergies />\n            <VitalSignsScreening />\n            <ChronicConditionsCarePlans />\n            <PreventiveCareRecords />\n            <PrivateSensitiveNotes />\n          </> : null}'''
if inner_new not in framework:
    if inner_old not in framework:
        raise SystemExit("Missing anchor for nested vault provider")
    framework = framework.replace(inner_old, inner_new, 1)

journal_old = '          <HealthTimeline state={state} endDate={dayKey} />'
journal_new = '          {activeProfileId ? <SymptomEpisodeTracking /> : null}\n          <HealthTimeline state={state} endDate={dayKey} />'
if journal_new not in framework:
    if journal_old not in framework:
        raise SystemExit("Missing anchor for journal timeline")
    framework = framework.replace(journal_old, journal_new, 1)

framework_path.write_text(framework)

replace_once(
    "app/suc-khoe-tre/page.tsx",
    'import "./preventive-care-records.css";\n',
    'import "./preventive-care-records.css";\nimport "./symptom-episode-tracking.css";\n',
    "page stylesheet",
)

replace_once(
    "package.json",
    'node scripts/validate-preventive-care-records.mjs",',
    'node scripts/validate-preventive-care-records.mjs && node scripts/validate-symptom-episode-tracking.mjs",',
    "validator chain",
)
