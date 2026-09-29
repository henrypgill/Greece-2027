"use server";

import { revalidatePath } from "next/cache";
import { ensureBringSeeded } from "@/lib/bring-db";
import { db } from "@/lib/db";
import { isAdminSession } from "@/lib/session";

// Admin only. Arguments arrive from the client, so they're checked here too.

export type BringResult =
  { ok: true } | { ok: false; message: string; field?: "item" | "note" };

const NOT_ADMIN = "Only admins can do this. Log in with the admin password.";

/** Adds an item (id "new", goes at the end) or updates one. */
export async function saveBringItem(
  id: number | "new",
  rawItem: string,
  rawNote: string,
): Promise<BringResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (id !== "new" && !Number.isInteger(id)) {
    return { ok: false, message: "Unknown item." };
  }
  const item = typeof rawItem === "string" ? rawItem.trim() : "";
  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  if (!item) return { ok: false, field: "item", message: "Required." };
  if (item.length > 100) {
    return {
      ok: false,
      field: "item",
      message: "Keep it under 100 characters.",
    };
  }
  if (note.length > 300) {
    return {
      ok: false,
      field: "note",
      message: "Keep it under 300 characters.",
    };
  }

  try {
    await ensureBringSeeded();
    const sql = await db();
    if (id === "new") {
      await sql`
        INSERT INTO bring_items (sort_order, item, note)
        VALUES (
          (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM bring_items),
          ${item}, ${note}
        )
      `;
    } else {
      await sql`
        UPDATE bring_items SET item = ${item}, note = ${note} WHERE id = ${id}
      `;
    }
  } catch (error) {
    console.error("saveBringItem failed", error);
    return { ok: false, message: "Couldn't save. Try again." };
  }
  revalidatePath("/bring");
  return { ok: true };
}

export async function deleteBringItem(id: number): Promise<BringResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (!Number.isInteger(id)) return { ok: false, message: "Unknown item." };
  try {
    const sql = await db();
    await sql`DELETE FROM bring_items WHERE id = ${id}`;
  } catch (error) {
    console.error("deleteBringItem failed", error);
    return { ok: false, message: "Couldn't delete. Try again." };
  }
  revalidatePath("/bring");
  return { ok: true };
}
