from pathlib import Path

path = Path("app/suc-khoe-tre/health-framework.tsx")
text = path.read_text()

if 'import PremiumHealthHeroArt from "./premium-health-hero-art";' not in text:
    anchor = 'import PremiumQuickActions from "./premium-quick-actions";\n'
    if anchor not in text:
        raise SystemExit('Missing PremiumQuickActions import anchor')
    text = text.replace(anchor, anchor + 'import PremiumHealthHeroArt from "./premium-health-hero-art";\n', 1)

old = '<div className="hf-topbar"><div><span className="hf-kicker">Health Care · Vì một thế hệ khỏe mạnh hơn</span><h1>{state.profile.name ? `Xin chào, ${state.profile.name}!` : "Sức khỏe Y tế 9–18 tuổi"}</h1><small>{profileAge.stage?.label ? `${profileAge.stage.label} · Những thói quen nhỏ hôm nay tạo nên một phiên bản khỏe mạnh hơn của ngày mai.` : "Những thói quen nhỏ hôm nay tạo nên một phiên bản khỏe mạnh hơn của ngày mai."}</small></div><div className="hf-top-status"><span className="hf-dot" />{contentReady ? `${device.deviceCode} · thiết bị đã được quản trị` : "Đang chờ nội dung"}</div></div>'
new = '<div className="hf-topbar"><div><span className="hf-kicker">Health Care · Vì một thế hệ khỏe mạnh hơn</span><h1>{state.profile.name ? `Xin chào, ${state.profile.name}!` : "Sức khỏe Y tế 9–18 tuổi"}</h1><small>{profileAge.stage?.label ? `${profileAge.stage.label} · Những thói quen nhỏ hôm nay tạo nên một phiên bản khỏe mạnh hơn của ngày mai.` : "Những thói quen nhỏ hôm nay tạo nên một phiên bản khỏe mạnh hơn của ngày mai."}</small></div><PremiumHealthHeroArt /><div className="hf-top-status"><span className="hf-dot" />{contentReady ? `${device.deviceCode} · thiết bị đã được quản trị` : "Đang chờ nội dung"}</div></div>'
if '<PremiumHealthHeroArt />' not in text:
    if old not in text:
        raise SystemExit('Missing hero markup anchor')
    text = text.replace(old, new, 1)

path.write_text(text)
