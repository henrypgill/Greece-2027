// Session tokens: "<role>.<expiry-ms>.<HMAC-SHA256 signature of role.expiry>",
// stored in an httpOnly cookie. Stateless, so no database is needed. Uses Web
// Crypto so it works in both the proxy and route handlers.
//
// Two roles: "user" (USER_PASSWORD) sees the site; "admin" (ADMIN_PASSWORD)
// can also edit the itinerary and the attendance list.

export const SESSION_COOKIE = "session";
export const SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 hours

export type Role = "user" | "admin";
const ROLES: readonly Role[] = ["user", "admin"];

const encoder = new TextEncoder();

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  const length = Math.max(ab.length, bb.length);
  for (let i = 0; i < length; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

/** Returns a new token, or null if AUTH_SECRET is not configured. */
export async function createSessionToken(role: Role): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const payload = `${role}.${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${payload}.${await sign(payload, secret)}`;
}

/**
 * The token's role, or null if it isn't valid. Fails closed: any missing
 * config, malformed (including old pre-role tokens) or expired token is null.
 */
export async function getTokenRole(
  token: string | null | undefined,
): Promise<Role | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [role, expires, signature] = parts;
  if (!ROLES.includes(role as Role)) return null;

  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  const valid = safeEqual(signature, await sign(`${role}.${expires}`, secret));
  return valid ? (role as Role) : null;
}

/** True for any signed-in role. */
export async function verifySessionToken(
  token: string | null | undefined,
): Promise<boolean> {
  return (await getTokenRole(token)) !== null;
}
