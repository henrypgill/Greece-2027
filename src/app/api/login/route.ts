import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
} from "@/lib/auth";
import {
  checkLimit,
  getClientIp,
  recordFailure,
  type LimitStatus,
} from "@/lib/rate-limit";

function tooManyAttempts(status: LimitStatus) {
  return NextResponse.json(
    { error: "too_many_attempts", retryAfterSeconds: status.retryAfterSeconds },
    {
      status: 429,
      headers: { "Retry-After": String(status.retryAfterSeconds) },
    },
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const limit = checkLimit(ip);
  if (limit.blocked) return tooManyAttempts(limit);

  const expected = process.env.APP_PASSWORD;
  if (!expected || !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  let password = "";
  try {
    const body = await request.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    // Treated as an empty (wrong) password below.
  }

  if (!password || !safeEqual(password, expected)) {
    const after = recordFailure(ip);
    if (after.blocked) return tooManyAttempts(after);
    return NextResponse.json(
      { error: "invalid_password", remaining: after.remaining },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // sent when opening a link to the site from another app
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
