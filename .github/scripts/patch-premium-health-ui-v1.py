from pathlib import Path

path = Path("app/suc-khoe-tre/health-framework.tsx")
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    if new in text:
        return
    if old not in text:
        raise SystemExit(f"Missing anchor for {label}")
    text = text.replace(old, new, 1)

replace_once(
    'import ProfileSwitcher from "./profile-switcher";\n',
    'import ProfileSwitcher from "./profile-switcher";\nimport PremiumQuickActions from "./premium-quick-actions";\n',
    "premium quick actions import",
)

replace_once(
    '<div className="hf-topbar"><div><span className="hf-kicker">Theo dõi xuyên suốt · 9 đến hết 18 tuổi</span><h1>Sức khỏe Y tế 9–18 tuổi</h1><small>{profileAge.stage?.label ?? "Nhập ngày sinh để xác định giai đoạn phát triển"}</small></div><div className="hf-top-status"><span className="hf-dot" />{contentReady ? `${device.deviceCode} · đã cấp truy cập` : "Đang chờ nội dung"}</div></div>',
    '<div className="hf-topbar"><div><span className="hf-kicker">Health Care · Vì một thế hệ khỏe mạnh hơn</span><h1>{state.profile.name ? `Xin chào, ${state.profile.name}!` : "Sức khỏe Y tế 9–18 tuổi"}</h1><small>{profileAge.stage?.label ? `${profileAge.stage.label} · Những thói quen nhỏ hôm nay tạo nên một phiên bản khỏe mạnh hơn của ngày mai.` : "Những thói quen nhỏ hôm nay tạo nên một phiên bản khỏe mạnh hơn của ngày mai."}</small></div><div className="hf-top-status"><span className="hf-dot" />{contentReady ? `${device.deviceCode} · thiết bị đã được quản trị` : "Đang chờ nội dung"}</div></div>',
    "premium hero copy",
)

replace_once(
    '<SectionHeader title={dayKey === today ? "Hôm nay" : "Ngày đã chọn"} description="Checklist, tiến độ và nhắc việc được giữ liên tục khi trẻ lớn dần; nội dung chuyên môn sẽ thay đổi theo giai đoạn tuổi." aside={hydrated ? formatDate(dayKey) : "Đang đọc dữ liệu…"} />\n          <StagePanel stage={profileAge.stage} />',
    '<SectionHeader title={dayKey === today ? "Hôm nay" : "Ngày đã chọn"} description="Checklist, tiến độ và nhắc việc được giữ liên tục khi trẻ lớn dần; nội dung chuyên môn sẽ thay đổi theo giai đoạn tuổi." aside={hydrated ? formatDate(dayKey) : "Đang đọc dữ liệu…"} />\n          <PremiumQuickActions onNavigate={(target) => setActive(target)} />\n          <StagePanel stage={profileAge.stage} />',
    "premium quick actions placement",
)

path.write_text(text)
