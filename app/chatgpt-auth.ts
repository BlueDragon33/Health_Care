import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export type ChatGPTUser = { displayName: string; email: string; fullName: string | null };

const COOKIE = "health_care_editor_session";
const LEGACY_COOKIE = "child_health_editor_session";
const MAX_AGE = 8 * 60 * 60;
const CONTROL_ISSUER = "application-management";
const CONTROL_AUDIENCE = "health-care-control";
const CONTROL_APP = "health-care";
const LEGACY_CONTROL_ISSUER = "quan-ly-hoc-tap";
const LEGACY_CONTROL_AUDIENCE = "child-health-control";
const LEGACY_CONTROL_APP = "child-health";
const SESSION_ISSUER = "health-care";
const SESSION_AUDIENCE = "health-care-editor";
const LEGACY_SESSION_ISSUER = "suc-khoe-tre";
const LEGACY_SESSION_AUDIENCE = "child-health-editor";

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decode(value: string) {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 4096) return null;
    const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function secret() {
  const workers = await import("cloudflare:workers");
  const value = (workers.env as unknown as Record<string, unknown>).HEALTH_CONTROL_SERVICE_SECRET;
  return typeof value === "string" && value.length >= 32 ? value : "";
}

async function sign(value: string) {
  const valueSecret = await secret();
  if (!valueSecret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(valueSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

async function validSignedToken(token: string) {
  if (!token || token.length > 8192) return null;
  const [version, encoded, suppliedSignature, extra] = token.split(".");
  if (version !== "v1" || !encoded || !suppliedSignature || extra) return null;
  const expected = await sign(`${version}.${encoded}`);
  if (!expected || expected.length !== suppliedSignature.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
  }
  if (difference) return null;
  const bytes = decode(encoded);
  if (!bytes) return null;
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function validControlIdentity(payload: Record<string, unknown>) {
  const canonical = payload.iss === CONTROL_ISSUER
    && payload.aud === CONTROL_AUDIENCE
    && payload.app === CONTROL_APP;
  const legacy = payload.iss === LEGACY_CONTROL_ISSUER
    && payload.aud === LEGACY_CONTROL_AUDIENCE
    && (payload.app === LEGACY_CONTROL_APP || payload.app === undefined);
  return canonical || legacy;
}

export async function createEditorSessionFromControlTicket(ticket: string) {
  const bridge = await validSignedToken(ticket);
  if (!bridge || !validControlIdentity(bridge)) return null;

  const actor = typeof bridge.actor === "string" ? bridge.actor.trim().toLowerCase().slice(0, 160) : "";
  const role = typeof bridge.role === "string" ? bridge.role : "viewer";
  const exp = typeof bridge.exp === "number" ? bridge.exp : 0;
  const issuedAt = typeof bridge.iat === "number" ? bridge.iat : 0;
  if (
    !actor.includes("@")
    || !["reviewer", "publisher", "owner"].includes(role)
    || exp <= Date.now()
    || exp > Date.now() + 10 * 60 * 1000
    || (issuedAt > 0 && issuedAt > Date.now() + 60_000)
  ) return null;

  const sessionPayload = base64Url(new TextEncoder().encode(JSON.stringify({
    iss: SESSION_ISSUER,
    aud: SESSION_AUDIENCE,
    email: actor,
    displayName: actor,
    role,
    exp: Date.now() + MAX_AGE * 1000,
  })));
  const input = `v1.${sessionPayload}`;
  const sessionSignature = await sign(input);
  if (!sessionSignature) return null;
  return {
    token: `${input}.${sessionSignature}`,
    user: { displayName: actor, email: actor, fullName: null } satisfies ChatGPTUser,
  };
}

function validSessionIdentity(payload: Record<string, unknown>) {
  return (payload.iss === SESSION_ISSUER && payload.aud === SESSION_AUDIENCE)
    || (payload.iss === LEGACY_SESSION_ISSUER && payload.aud === LEGACY_SESSION_AUDIENCE);
}

async function sessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? cookieStore.get(LEGACY_COOKIE)?.value ?? "";
  const payload = await validSignedToken(token);
  if (!payload || !validSessionIdentity(payload)) return null;
  const email = typeof payload.email === "string" ? payload.email : "";
  const displayName = typeof payload.displayName === "string" ? payload.displayName : email;
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (!email.includes("@") || exp <= Date.now()) return null;
  return { displayName, email, fullName: null } satisfies ChatGPTUser;
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  if (email) {
    const encodedName = requestHeaders.get("oai-authenticated-user-full-name");
    let fullName: string | null = null;
    if (encodedName && requestHeaders.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
      try { fullName = decodeURIComponent(encodedName); } catch { fullName = null; }
    }
    return { displayName: fullName ?? email, email, fullName };
  }
  return sessionUser();
}

export async function requireChatGPTUser(returnTo: string) {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(`/editor-login-required?returnTo=${encodeURIComponent(returnTo.startsWith("/") ? returnTo : "/bien-tap-suc-khoe-tre")}`);
}

export function editorSessionCookie(token: string) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}
