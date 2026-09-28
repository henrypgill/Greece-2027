// Session tokens: "<expiry-ms>.<HMAC-SHA256 signature>", stored in an httpOnly
// cookie. Stateless, so no database is needed. Uses Web Crypto so it works in
// both the proxy and route handlers.

export const SESSION_COOKIE = "session";
export const SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 hours

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
export async function createSessionToken(): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const expires = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  return `${expires}.${await sign(expires, secret)}`;
}

/** Fails closed: any missing config, malformed or expired token is rejected. */
export async function verifySessionToken(
  token: string | null | undefined,
): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;

  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;

  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return safeEqual(signature, await sign(expires, secret));
}
