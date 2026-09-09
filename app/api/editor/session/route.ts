import { createEditorSessionFromControlTicket, editorSessionCookie } from "../../../chatgpt-auth";

export const dynamic = "force-dynamic";

function sessionResponse(token: string) {
  const response = Response.json({ ok: true }, {
    status: 200,
    headers: {
      "cache-control": "no-store, private",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
  response.headers.append("set-cookie", editorSessionCookie(token));
  return response;
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Yêu cầu mở trình biên tập không hợp lệ." }, { status: 400 });
  }
  const ticket = typeof body.ticket === "string" ? body.ticket : "";
  const session = await createEditorSessionFromControlTicket(ticket);
  if (!session) {
    return Response.json(
      { ok: false, error: "Vé mở trình biên tập đã hết hạn hoặc không hợp lệ." },
      { status: 403, headers: { "cache-control": "no-store, private", "referrer-policy": "no-referrer" } },
    );
  }
  return sessionResponse(session.token);
}

/**
 * Tương thích ngắn hạn với link query cũ. Link mới phải dùng /editor-bridge#ticket=...
 * để vé không xuất hiện trong request URL hay referrer.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ticket = url.searchParams.get("ticket") ?? "";
  if (!ticket) return Response.redirect(new URL("/editor-login-required", request.url), 303);
  const target = new URL("/editor-bridge", request.url);
  target.hash = `ticket=${encodeURIComponent(ticket)}`;
  const response = Response.redirect(target, 303);
  response.headers.set("cache-control", "no-store, private");
  response.headers.set("referrer-policy", "no-referrer");
  return response;
}
