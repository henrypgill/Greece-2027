"use server";

import { revalidatePath } from "next/cache";
import { isAdminSession } from "@/lib/session";
import { setTripDescription } from "@/lib/settings-db";

// Home page actions. Admin only; arguments arrive from the client, so they're
// checked here too.

export type SaveResult = { ok: true } | { ok: false; message: string };

export async function saveTripDescription(raw: string): Promise<SaveResult> {
  if (!(await isAdminSession())) {
    return {
      ok: false,
      message: "Only admins can do this. Log in with the admin password.",
    };
  }
  const description = typeof raw === "string" ? raw.trim() : "";
  if (description.length > 5000) {
    return { ok: false, message: "Keep it under 5,000 characters." };
  }
  try {
    await setTripDescription(description);
  } catch (error) {
    console.error("saveTripDescription failed", error);
    return { ok: false, message: "Couldn't save. Try again." };
  }
  revalidatePath("/");
  return { ok: true };
}
