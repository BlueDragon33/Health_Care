from pathlib import Path

old = '<SecureVaultSessionProvider key={`vault-session-${activeProfileId}`} profileId={activeProfileId}>'
new = '<HealthVaultBoundary profileId={activeProfileId}>'

changed = []
for path in sorted(Path('scripts').glob('validate-*.mjs')):
    text = path.read_text()
    if old not in text:
        continue
    text = text.replace(old, new)
    path.write_text(text)
    changed.append(str(path))

print('Updated validators:')
for path in changed:
    print(f'- {path}')
if not changed:
    print('- none')
