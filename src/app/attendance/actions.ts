"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

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
  const cookieStore = await cookies();
  if (!(await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value))) {
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
