from pathlib import Path

p = Path("app/suc-khoe-tre/health-framework.tsx")
text = p.read_text()
old = '''    const profileSlug = (activeProfileIdentity?.displayName || "ho-so").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "ho-so";\n    anchor.href = url;'''
new = '''    const backupProfileName = activeProfileIdentity?.displayName || state.profile.name || "đang chọn";\n    const profileSlug = (backupProfileName || "ho-so").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "ho-so";\n    anchor.href = url;'''
if old not in text:
    raise SystemExit("profileSlug block not found")
text = text.replace(old, new, 1)
old_notice = '    setBackupNotice(`Đã tạo bản sao riêng cho hồ sơ “${activeProfileIdentity?.displayName ?? state.profile.name || "đang chọn"}”.`);'
new_notice = '    setBackupNotice(`Đã tạo bản sao riêng cho hồ sơ “${backupProfileName}”.`);'
if old_notice not in text:
    raise SystemExit("backup notice expression not found")
text = text.replace(old_notice, new_notice, 1)
p.write_text(text)
