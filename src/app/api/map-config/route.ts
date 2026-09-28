import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// The Mapbox token is only ever served to a signed-in session, so it is not
// part of the public JS bundle. The proxy already blocks unauthenticated
// requests; this check is a second layer.
export async function GET() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(session))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { token: process.env.MAPBOX_TOKEN ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
