from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

center_import = 'import SecureVaultCenter from "./secure-vault-center";\n'
if center_import not in text:
    raise SystemExit("SecureVaultCenter import not found")
extra_imports = 'import { SecureVaultSessionProvider } from "./secure-vault-session";\nimport PrivateSensitiveNotes from "./private-sensitive-notes";\n'
if 'import { SecureVaultSessionProvider } from "./secure-vault-session";' not in text:
    text = text.replace(center_import, center_import + extra_imports, 1)

old = '''          {activeProfileId ? <PrivacyCenter key={activeProfileId} profileId={activeProfileId} /> : null}\n          {activeProfileId ? <SecureVaultCenter key={`vault-${activeProfileId}`} profileId={activeProfileId} /> : null}\n'''
new = '''          {activeProfileId ? <SecureVaultSessionProvider key={`vault-session-${activeProfileId}`} profileId={activeProfileId}>\n            <PrivacyCenter profileId={activeProfileId} />\n            <SecureVaultCenter />\n            <PrivateSensitiveNotes />\n          </SecureVaultSessionProvider> : null}\n'''
if old not in text:
    raise SystemExit("old Privacy/Vault runtime block not found")
text = text.replace(old, new, 1)
p.write_text(text)
