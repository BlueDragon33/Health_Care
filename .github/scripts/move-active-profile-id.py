from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()
block = '''\n  const activeProfileId = profileRegistry?.activeProfileId ?? "";\n  const activeProfileIdentity = profileRegistry?.profiles.find((item) => item.id === activeProfileId) ?? null;\n'''
if text.count(block) != 1:
    raise SystemExit(f"expected one active profile declaration block, found {text.count(block)}")
text = text.replace(block, "", 1)
anchor = '  const [backupNotice, setBackupNotice] = useState("");\n'
if anchor not in text:
    raise SystemExit("backupNotice anchor not found")
text = text.replace(anchor, anchor + block, 1)
p.write_text(text)
