from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

old_import = 'import WeeklyHealthSummary from "./weekly-health-summary";\n'
new_import = old_import + 'import HealthTimeline from "./health-timeline";\n'
if old_import not in text:
    raise SystemExit("WeeklyHealthSummary import not found")
if 'import HealthTimeline from "./health-timeline";' not in text:
    text = text.replace(old_import, new_import, 1)

anchor = '        </section> : null}\n\n        {active === "profile"'
replacement = '          <HealthTimeline state={state} endDate={dayKey} />\n        </section> : null}\n\n        {active === "profile"'
if anchor not in text:
    raise SystemExit("journal -> profile insertion point not found")
if '<HealthTimeline state={state} endDate={dayKey} />' not in text:
    text = text.replace(anchor, replacement, 1)

p.write_text(text)
