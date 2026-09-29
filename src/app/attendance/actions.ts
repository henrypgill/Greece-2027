"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hasValidSession, isAdminSession } from "@/lib/session";

export type AttendState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Echoed back so the form keeps what was typed after an error. */
  firstName?: string;
  lastName?: string;
  /** Changes on every response; the form remounts on it (see AttendForm). */
  responseId?: number;
};

const MAX_LENGTH = 50;

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export async function addAttendee(
  prev: AttendState,
  formData: FormData,
): Promise<AttendState> {
  return {
    ...(await handleAttend(formData)),
    responseId: (prev.responseId ?? 0) + 1,
  };
}

async function handleAttend(formData: FormData): Promise<AttendState> {
  // Server Actions can be POSTed to directly, so check the session here too,
  // not just in the proxy.
  if (!(await hasValidSession())) {
    return {
      status: "error",
      message: "Your session has expired. Log in again.",
    };
  }

  const firstName = clean(formData.get("firstName"));
  const lastName = clean(formData.get("lastName"));
  const echo = { firstName, lastName };

  if (!firstName || !lastName) {
    return {
      status: "error",
      message: "Enter your first and last name.",
      ...echo,
    };
  }
  if (firstName.length > MAX_LENGTH || lastName.length > MAX_LENGTH) {
    return { status: "error", message: "That name is too long.", ...echo };
  }

  try {
    const sql = await db();
    const inserted = await sql`
      INSERT INTO attendees (first_name, last_name)
      VALUES (${firstName}, ${lastName})
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    revalidatePath("/attendance");
    return inserted.length > 0
      ? { status: "success", message: `You're on the list, ${firstName}!` }
      : {
          status: "success",
          message: `${firstName} ${lastName} is already on the list.`,
        };
  } catch (error) {
    console.error("addAttendee failed", error);
    return {
      status: "error",
      message: "Something went wrong. Try again.",
      ...echo,
    };
  }
}

// Admin only. Arguments arrive from the client, so they're checked here too.

export type AdminResult = { ok: true } | { ok: false; message: string };

const NOT_ADMIN = "Only admins can do this. Log in with the admin password.";

export async function updateAttendee(
  id: number,
  rawFirstName: string,
  rawLastName: string,
): Promise<AdminResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (!Number.isInteger(id)) return { ok: false, message: "Unknown person." };
  const firstName = clean(rawFirstName);
  const lastName = clean(rawLastName);
  if (!firstName || !lastName) {
    return { ok: false, message: "Enter a first and last name." };
  }
  if (firstName.length > MAX_LENGTH || lastName.length > MAX_LENGTH) {
    return { ok: false, message: "That name is too long." };
  }
  try {
    const sql = await db();
    // Changes nothing if someone else already has that name.
    const updated = await sql`
      UPDATE attendees SET first_name = ${firstName}, last_name = ${lastName}
      WHERE id = ${id}
        AND NOT EXISTS (
          SELECT 1 FROM attendees
          WHERE id <> ${id}
            AND lower(first_name) = lower(${firstName})
            AND lower(last_name) = lower(${lastName})
        )
      RETURNING id
    `;
    revalidatePath("/attendance");
    if (updated.length === 0) {
      return {
        ok: false,
        message: `${firstName} ${lastName} is already on the list.`,
      };
    }
    return { ok: true };
  } catch (error) {
    console.error("updateAttendee failed", error);
    return { ok: false, message: "Couldn't save. Try again." };
  }
}

export async function removeAttendee(id: number): Promise<AdminResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (!Number.isInteger(id)) return { ok: false, message: "Unknown person." };
  try {
    const sql = await db();
    await sql`DELETE FROM attendees WHERE id = ${id}`;
    revalidatePath("/attendance");
    return { ok: true };
  } catch (error) {
    console.error("removeAttendee failed", error);
    return { ok: false, message: "Couldn't remove. Try again." };
  }
}
