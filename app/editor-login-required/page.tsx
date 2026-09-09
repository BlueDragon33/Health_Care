export const dynamic = "force-dynamic";

export default function EditorLoginRequired() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f3f7f6", fontFamily: "system-ui, sans-serif" }}>
    <section style={{ maxWidth: 620, background: "white", padding: 28, borderRadius: 18, boxShadow: "0 14px 40px rgba(0,0,0,.08)" }}>
      <h1>Cần mở trình biên tập từ Application Management</h1>
      <p>Để bảo vệ nội dung y tế, trình biên tập chỉ tạo phiên sau khi bạn đã đăng nhập ChatGPT, thiết bị quản trị QT đã được cấp quyền và Application Management phát vé Health ngắn hạn.</p>
      <p>Hãy quay lại Site <strong>Application Management</strong> trong ChatGPT, mở <strong>Sức khỏe Y tế → Duyệt nội dung</strong>, rồi chọn <strong>Mở trình biên tập Health_Care</strong>.</p>
      <a href="/suc-khoe-tre">Về Web App Sức khỏe Y tế</a>
    </section>
  </main>;
}
