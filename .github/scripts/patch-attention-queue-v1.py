from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

import_anchor = 'import ReminderManager, { repeatLabels } from "./reminder-manager";\n'
if import_anchor not in text:
    raise SystemExit("ReminderManager import not found")
if 'import AttentionQueue from "./attention-queue";' not in text:
    text = text.replace(import_anchor, import_anchor + 'import AttentionQueue from "./attention-queue";\n', 1)

today_start = text.find('          <div className="hf-today-grid">')
dashboard = text.find('          <div className="hf-dashboard-grid">', today_start)
if today_start < 0 or dashboard < 0:
    raise SystemExit("Today insertion point not found")
queue = '          <AttentionQueue state={state} onNavigate={(target) => setActive(target)} />\n'
if queue.strip() not in text:
    text = text[:dashboard] + queue + text[dashboard:]

p.write_text(text)
