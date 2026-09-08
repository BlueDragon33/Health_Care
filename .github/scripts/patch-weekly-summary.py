from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

old_import = 'import GrowthTrend from "./growth-trend";\n'
new_import = old_import + 'import WeeklyHealthSummary from "./weekly-health-summary";\n'
if old_import not in text:
    raise SystemExit("GrowthTrend import not found")
text = text.replace(old_import, new_import, 1)

replacements = [
    (
        '        </section> : null}\n\n        {active === "activity"',
        '          <WeeklyHealthSummary state={state} endDate={dayKey} mode="nutrition" />\n        </section> : null}\n\n        {active === "activity"',
        "nutrition",
    ),
    (
        '        </section> : null}\n\n        {active === "care"',
        '          <WeeklyHealthSummary state={state} endDate={dayKey} mode="activity" />\n        </section> : null}\n\n        {active === "care"',
        "activity",
    ),
    (
        '        </section> : null}\n\n        {active === "journal"',
        '          <WeeklyHealthSummary state={state} endDate={dayKey} mode="care" />\n        </section> : null}\n\n        {active === "journal"',
        "care",
    ),
]
for old, new, name in replacements:
    if old not in text:
        raise SystemExit(f"{name} weekly summary insertion point not found")
    text = text.replace(old, new, 1)

p.write_text(text)
