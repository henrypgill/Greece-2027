import { cookies } from "next/headers";
import { SESSION_COOKIE, getTokenRole, type Role } from "@/lib/auth";

// For Server Actions and server components: Server Actions can be POSTed to
// directly, so each one checks the session itself rather than relying only
// on the proxy.

export async function getSessionRole(): Promise<Role | null> {
  const cookieStore = await cookies();
  return getTokenRole(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function hasValidSession(): Promise<boolean> {
  return (await getSessionRole()) !== null;
}

export async function isAdminSession(): Promise<boolean> {
  return (await getSessionRole()) === "admin";
}
