from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()

import_anchor = 'import ProfileSwitcher from "./profile-switcher";\n'
if import_anchor not in text:
    raise SystemExit("ProfileSwitcher import anchor not found")
if 'import PrivacyCenter from "./privacy-center";' not in text:
    text = text.replace(import_anchor, import_anchor + 'import PrivacyCenter from "./privacy-center";\n', 1)

notification_token = '<span className="hf-kicker">Thông báo trình duyệt</span>'
pos = text.find(notification_token)
if pos < 0:
    raise SystemExit("notification panel not found")
work_grid = text.rfind('          <div className="hf-work-grid">', 0, pos)
if work_grid < 0:
    raise SystemExit("second profile work-grid not found")
privacy = '          {activeProfileId ? <PrivacyCenter key={activeProfileId} profileId={activeProfileId} /> : null}\n'
if '<PrivacyCenter key={activeProfileId} profileId={activeProfileId} />' not in text:
    text = text[:work_grid] + privacy + text[work_grid:]

p.write_text(text)
