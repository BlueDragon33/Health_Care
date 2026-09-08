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
    'import VitalSignsScreening from "./vital-signs-screening";\n',
    'import VitalSignsScreening from "./vital-signs-screening";\nimport ChronicConditionsCarePlans from "./chronic-conditions-care-plans";\n',
    "framework import",
)

replace_once(
    "app/suc-khoe-tre/health-framework.tsx",
    '            <VitalSignsScreening />\n            <PrivateSensitiveNotes />',
    '            <VitalSignsScreening />\n            <ChronicConditionsCarePlans />\n            <PrivateSensitiveNotes />',
    "framework composition",
)

replace_once(
    "app/suc-khoe-tre/page.tsx",
    'import "./vital-signs-screening.css";\n',
    'import "./vital-signs-screening.css";\nimport "./chronic-conditions-care-plans.css";\n',
    "page stylesheet",
)

replace_once(
    "package.json",
    'node scripts/validate-vital-signs-screening.mjs",',
    'node scripts/validate-vital-signs-screening.mjs && node scripts/validate-chronic-conditions-care-plans.mjs",',
    "package validator chain",
)
