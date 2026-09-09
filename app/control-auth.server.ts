import { DeviceAccessError } from "./device-auth.server";

const TOKEN_ISSUER = "application-management";
const TOKEN_AUDIENCE = "health-care-control";
const TOKEN_APP = "health-care";
const LEGACY_TOKEN_ISSUER = "quan-ly-hoc-tap";
const LEGACY_TOKEN_AUDIENCE = "child-health-control";
const LEGACY_TOKEN_APP = "child-health";
const MAX_CONTROL_BEARER_LENGTH = 8192;

export type ControlSecretScope = "health" | "unconfigured";

export type ControlServiceIdentity = {
  actor: string;
  role: string;
  controlDeviceId: string | null;
  ticketId: string | null;
};

export type ControlWebLaunchIdentity = {
  actor: string;
  role: string;
  controlDeviceId: string;
  ticketId: string;
};

async function controlSecretConfig(): Promise<{ secret: string; scope: ControlSecretScope }> {
  const workers = await import("cloudflare:workers");
  const values = workers.env as unknown as Record<string, unknown>;
  const healthSecret = typeof values.HEALTH_CONTROL_SERVICE_SECRET === "string"
    ? values.HEALTH_CONTROL_SERVICE_SECRET
    : "";
  if (healthSecret.length >= 32) return { secret: healthSecret, scope: "health" };
  return { secret: "", scope: "unconfigured" };
}

export async function getControlSecretScope(): Promise<ControlSecretScope> {
  return (await controlSecretConfig()).scope;
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function secureEqual(left: string, right: string) {
  const [a, b] = await Promise.all([digest(left), digest(right)]);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 3072) {
    throw new DeviceAccessError("Vé quản trị không hợp lệ.", 403, "CONTROL_TICKET_INVALID");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch {
    throw new DeviceAccessError("Vé quản trị không hợp lệ.", 403, "CONTROL_TICKET_INVALID");
  }
}

async function signature(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

function acceptedControlIdentity(payload: Record<string, unknown>) {
  const canonical = payload.iss === TOKEN_ISSUER
    && payload.aud === TOKEN_AUDIENCE
    && payload.app === TOKEN_APP;
  const legacy = payload.iss === LEGACY_TOKEN_ISSUER
    && payload.aud === LEGACY_TOKEN_AUDIENCE
    && (payload.app === LEGACY_TOKEN_APP || payload.app === undefined);
  return canonical || legacy;
}

function canonicalControlIdentity(payload: Record<string, unknown>) {
  return payload.iss === TOKEN_ISSUER
    && payload.aud === TOKEN_AUDIENCE
    && payload.app === TOKEN_APP;
}

async function signedTicketPayload(secret: string, supplied: string): Promise<Record<string, unknown> | null> {
  if (supplied.length < 32 || supplied.length > MAX_CONTROL_BEARER_LENGTH) return null;
  const [version, encoded, suppliedSignature, extra] = supplied.split(".");
  if (version !== "v1" || !encoded || !suppliedSignature || extra) return null;
  const expected = await signature(secret, `${version}.${encoded}`);
  if (!(await secureEqual(expected, suppliedSignature))) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizedTicketIdentity(payload: Record<string, unknown>) {
  const actor = typeof payload.actor === "string" ? payload.actor.trim().toLowerCase().slice(0, 160) : "";
  const suppliedRole = typeof payload.role === "string" ? payload.role : "viewer";
  const role = ["viewer", "reviewer", "publisher", "owner"].includes(suppliedRole) ? suppliedRole : "viewer";
  const expiresAt = typeof payload.exp === "number" ? payload.exp : 0;
  const issuedAt = typeof payload.iat === "number" ? payload.iat : 0;
  const controlDeviceId = typeof payload.controlDeviceId === "string" && /^[a-f0-9]{64}$/.test(payload.controlDeviceId)
    ? payload.controlDeviceId
    : null;
  const ticketId = typeof payload.jti === "string" && /^[A-Za-z0-9_-]{16,100}$/.test(payload.jti)
    ? payload.jti
    : null;
  return { actor, role, expiresAt, issuedAt, controlDeviceId, ticketId };
}

async function browserTicket(secret: string, supplied: string): Promise<ControlServiceIdentity | null> {
  const payload = await signedTicketPayload(secret, supplied);
  if (!payload) return null;
  const identity = normalizedTicketIdentity(payload);
  const controlPurpose = payload.purpose === undefined || payload.purpose === "control";
  if (
    !controlPurpose
    || !acceptedControlIdentity(payload)
    || !identity.actor.includes("@")
    || identity.expiresAt <= Date.now()
    || identity.expiresAt > Date.now() + 10 * 60 * 1000
    || (identity.issuedAt > 0 && identity.issuedAt > Date.now() + 60_000)
  ) return null;
  return {
    actor: identity.actor,
    role: identity.role,
    controlDeviceId: identity.controlDeviceId,
    ticketId: identity.ticketId,
  };
}

export async function verifyControlWebLaunchTicket(supplied: string): Promise<ControlWebLaunchIdentity> {
  const { secret } = await controlSecretConfig();
  if (secret.length < 32) {
    throw new DeviceAccessError(
      "Control Plane Sức khỏe Y tế chưa được cấu hình khóa kết nối trong ChatGPT Sites.",
      503,
      "HEALTH_CONTROL_SECRET_UNCONFIGURED",
    );
  }
  const payload = await signedTicketPayload(secret, supplied);
  if (!payload) throw new DeviceAccessError("Vé mở Web Sức khỏe Y tế không hợp lệ.", 403, "CONTROL_WEB_LAUNCH_FORBIDDEN");
  const identity = normalizedTicketIdentity(payload);
  if (
    payload.purpose !== "web-launch"
    || !canonicalControlIdentity(payload)
    || !identity.actor.includes("@")
    || !identity.controlDeviceId
    || !identity.ticketId
    || identity.expiresAt <= Date.now()
    || identity.expiresAt > Date.now() + 2 * 60 * 1000
    || identity.issuedAt <= 0
    || identity.issuedAt > Date.now() + 60_000
  ) {
    throw new DeviceAccessError("Vé mở Web Sức khỏe Y tế đã hết hạn hoặc không hợp lệ.", 403, "CONTROL_WEB_LAUNCH_FORBIDDEN");
  }
  return {
    actor: identity.actor,
    role: identity.role,
    controlDeviceId: identity.controlDeviceId,
    ticketId: identity.ticketId,
  };
}

export async function requireControlService(request: Request): Promise<ControlServiceIdentity> {
  const { secret: configured } = await controlSecretConfig();
  if (configured.length < 32) {
    throw new DeviceAccessError(
      "Control Plane Sức khỏe Y tế chưa được cấu hình khóa kết nối trong ChatGPT Sites.",
      503,
      "HEALTH_CONTROL_SECRET_UNCONFIGURED",
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (supplied.length < 32 || supplied.length > MAX_CONTROL_BEARER_LENGTH) {
    throw new DeviceAccessError("Dịch vụ quản trị không được phép truy cập.", 403, "CONTROL_SERVICE_FORBIDDEN");
  }

  if (!(await secureEqual(configured, supplied))) {
    const ticket = await browserTicket(configured, supplied);
    if (!ticket) {
      throw new DeviceAccessError("Vé quản trị đã hết hạn hoặc không hợp lệ.", 403, "CONTROL_TICKET_FORBIDDEN");
    }
    return ticket;
  }

  const actor = (request.headers.get("x-control-actor") ?? "system").trim().toLowerCase().slice(0, 160);
  const suppliedRole = (request.headers.get("x-control-role") ?? "viewer").trim().toLowerCase();
  const role = ["viewer", "reviewer", "publisher", "owner"].includes(suppliedRole) ? suppliedRole : "viewer";
  const controlDeviceId = (request.headers.get("x-control-device") ?? "").trim().toLowerCase();
  return {
    actor: actor || "system",
    role,
    controlDeviceId: /^[a-f0-9]{64}$/.test(controlDeviceId) ? controlDeviceId : null,
    ticketId: null,
  };
}

function isAllowedControlOrigin(origin: string) {
  if (!origin) return false;
  if (origin === "http://localhost:3000" || origin === "http://localhost:5173") return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:"
      && (url.hostname === "chatgpt.site" || url.hostname.endsWith(".chatgpt.site"));
  } catch {
    return false;
  }
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  return isAllowedControlOrigin(origin) ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  } : {};
}

export function controlResponse(data: unknown, status = 200, request?: Request) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store, private",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
      ...(request ? corsHeaders(request) : {}),
    },
  });
}

export function controlPreflight(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  if (!isAllowedControlOrigin(origin)) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function withControlCors(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
