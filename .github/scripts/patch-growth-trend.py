from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

old_import = 'import { assessWhoBmiForAge, calculateBmi, formatAgeMonths, type WhoBmiAssessment } from "./who-bmi-reference";\n'
new_import = old_import + 'import GrowthTrend from "./growth-trend";\n'
if old_import not in text:
    raise SystemExit("WHO growth import not found")
text = text.replace(old_import, new_import, 1)

old_anchor = '''          </div>\n          <section className="hf-panel hf-info-panel"><span className="hf-kicker">Ranh giới 18 → 19 tuổi</span>'''
new_anchor = '''          </div>\n          <GrowthTrend entries={growth} profile={state.profile} />\n          <section className="hf-panel hf-info-panel"><span className="hf-kicker">Ranh giới 18 → 19 tuổi</span>'''
if old_anchor not in text:
    raise SystemExit("growth insertion point not found")
text = text.replace(old_anchor, new_anchor, 1)

p.write_text(text)
