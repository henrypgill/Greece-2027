import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * For Server Actions: they can be POSTed to directly, so each one checks the
 * session itself rather than relying only on the proxy.
 */
export async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}
