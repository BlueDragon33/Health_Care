"use client";

import { useEffect, useState } from "react";

export default function EditorBridgePage() {
  const [message, setMessage] = useState("Đang xác thực vé biên tập từ Application Management…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const ticket = params.get("ticket") ?? "";

      // Xóa vé khỏi thanh địa chỉ trước khi thực hiện request tiếp theo.
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

      if (!ticket) {
        if (!cancelled) {
          setFailed(true);
          setMessage("Không tìm thấy vé biên tập. Hãy mở lại trình biên tập từ Application Management.");
        }
        return;
      }

      try {
        const response = await fetch("/api/editor/session", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ticket }),
        });
        const data = await response.json().catch(() => ({ ok: false, error: "Phản hồi xác thực không hợp lệ." })) as { ok?: boolean; error?: string };
        if (!response.ok || !data.ok) throw new Error(data.error || "Không thể tạo phiên biên tập.");
        if (!cancelled) window.location.replace("/bien-tap-suc-khoe-tre");
      } catch (error) {
        if (!cancelled) {
          setFailed(true);
          setMessage(error instanceof Error ? error.message : "Không thể mở trình biên tập.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f3f7f6", fontFamily: "system-ui, sans-serif" }}>
    <section style={{ width: "min(620px, 100%)", background: "white", padding: 30, borderRadius: 20, boxShadow: "0 14px 40px rgba(0,0,0,.08)" }}>
      <span style={{ display: "inline-flex", minWidth: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, background: "#e8f3f0", fontWeight: 800 }}>YT</span>
      <h1 style={{ marginBottom: 10 }}>{failed ? "Không thể mở trình biên tập" : "Đang mở trình biên tập Sức khỏe Y tế"}</h1>
      <p style={{ lineHeight: 1.6 }}>{message}</p>
      {failed ? <a href="/editor-login-required" style={{ display: "inline-block", marginTop: 12 }}>Xem hướng dẫn truy cập</a> : null}
    </section>
  </main>;
}
