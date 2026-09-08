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
    'import ChronicConditionsCarePlans from "./chronic-conditions-care-plans";\n',
    'import ChronicConditionsCarePlans from "./chronic-conditions-care-plans";\nimport PreventiveCareRecords from "./preventive-care-records";\n',
    "framework import",
)

replace_once(
    "app/suc-khoe-tre/health-framework.tsx",
    '            <ChronicConditionsCarePlans />\n            <PrivateSensitiveNotes />',
    '            <ChronicConditionsCarePlans />\n            <PreventiveCareRecords />\n            <PrivateSensitiveNotes />',
    "framework composition",
)

replace_once(
    "app/suc-khoe-tre/page.tsx",
    'import "./chronic-conditions-care-plans.css";\n',
    'import "./chronic-conditions-care-plans.css";\nimport "./preventive-care-records.css";\n',
    "page stylesheet",
)

replace_once(
    "package.json",
    'node scripts/validate-chronic-conditions-care-plans.mjs",',
    'node scripts/validate-chronic-conditions-care-plans.mjs && node scripts/validate-preventive-care-records.mjs",',
    "package validator chain",
)
