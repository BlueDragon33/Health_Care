from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    text = p.read_text()
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"Missing anchor for {label}: {old}")
    p.write_text(text.replace(old, new, 1))

replace_once(
    "app/suc-khoe-tre/health-framework.tsx",
    'import MedicationsAllergies from "./medications-allergies";\n',
    'import MedicationsAllergies from "./medications-allergies";\nimport VitalSignsScreening from "./vital-signs-screening";\n',
    "framework import",
)

replace_once(
    "app/suc-khoe-tre/health-framework.tsx",
    '            <MedicationsAllergies />\n            <PrivateSensitiveNotes />',
    '            <MedicationsAllergies />\n            <VitalSignsScreening />\n            <PrivateSensitiveNotes />',
    "framework composition",
)

replace_once(
    "app/suc-khoe-tre/page.tsx",
    'import "./medications-allergies.css";\n',
    'import "./medications-allergies.css";\nimport "./vital-signs-screening.css";\n',
    "page stylesheet",
)

replace_once(
    "package.json",
    'node scripts/validate-medications-allergies.mjs",',
    'node scripts/validate-medications-allergies.mjs && node scripts/validate-vital-signs-screening.mjs",',
    "package validator chain",
)

p = Path("app/suc-khoe-tre/vital-signs-screening.tsx")
text = p.read_text()
old = 'Record được đi cùng bản sao Secure Vault đã mã hóa, không đi vào bản sao baseline, Health Timeline hay Site Quản trị. Cập nhật giao diện gần nhất: {formatDateTime(new Date().toISOString())}.'
new = 'Record được đi cùng bản sao Secure Vault đã mã hóa, không đi vào bản sao baseline, Health Timeline hay Site Quản trị.'
if old in text:
    text = text.replace(old, new, 1)
text = text.replace('function formatDateTime(value: string) {\n  const date = new Date(value);\n  if (Number.isNaN(date.getTime())) return "—";\n  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);\n}\n\n', '')
p.write_text(text)
