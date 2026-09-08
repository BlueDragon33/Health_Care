from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

notes_import = 'import PrivateSensitiveNotes from "./private-sensitive-notes";\n'
meds_import = 'import MedicationsAllergies from "./medications-allergies";\n'
if meds_import not in text:
    if notes_import not in text:
        raise SystemExit("PrivateSensitiveNotes import anchor not found")
    text = text.replace(notes_import, meds_import + notes_import, 1)

runtime_anchor = '''            <SecureVaultBackupCenter />
            <PrivateSensitiveNotes />
'''
runtime_new = '''            <SecureVaultBackupCenter />
            <MedicationsAllergies />
            <PrivateSensitiveNotes />
'''
if "<MedicationsAllergies />" not in text:
    if runtime_anchor not in text:
        raise SystemExit("Vault runtime anchor not found")
    text = text.replace(runtime_anchor, runtime_new, 1)

p.write_text(text)
