"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdminSession } from "@/lib/session";
import { setPeopleCount } from "@/lib/settings-db";
import { ensureTripCostsSeeded } from "@/lib/trip-costs-db";

// Admin only. Arguments arrive from the client, so they're checked here too.

export type TripCostResult =
  { ok: true } | { ok: false; message: string; field?: "item" | "cost" };

const NOT_ADMIN = "Only admins can do this. Log in with the admin password.";

/** Adds an overall trip cost (id "new", goes at the end) or updates one. */
export async function saveTripCost(
  id: number | "new",
  rawItem: string,
  rawCost: string,
): Promise<TripCostResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (id !== "new" && !Number.isInteger(id)) {
    return { ok: false, message: "Unknown cost." };
  }

  const item = typeof rawItem === "string" ? rawItem.trim() : "";
  const costText = typeof rawCost === "string" ? rawCost.trim() : "";
  const cost = Number(costText);
  if (!item) {
    return { ok: false, field: "item", message: "Say what it's for." };
  }
  if (item.length > 100) {
    return {
      ok: false,
      field: "item",
      message: "Keep it under 100 characters.",
    };
  }
  if (!costText || !Number.isFinite(cost) || Math.abs(cost) >= 1e8) {
    return {
      ok: false,
      field: "cost",
      message: "Enter an amount, e.g. 1250.50",
    };
  }
  const amount = Math.round(cost * 100) / 100;

  try {
    await ensureTripCostsSeeded();
    const sql = await db();
    if (id === "new") {
      await sql`
        INSERT INTO trip_costs (sort_order, item, cost)
        VALUES (
          (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM trip_costs),
          ${item}, ${amount}
        )
      `;
    } else {
      await sql`
        UPDATE trip_costs SET item = ${item}, cost = ${amount}
        WHERE id = ${id}
      `;
    }
  } catch (error) {
    console.error("saveTripCost failed", error);
    return { ok: false, message: "Couldn't save. Try again." };
  }
  revalidatePath("/costs");
  return { ok: true };
}

export async function deleteTripCost(id: number): Promise<TripCostResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (!Number.isInteger(id)) return { ok: false, message: "Unknown cost." };
  try {
    const sql = await db();
    await sql`DELETE FROM trip_costs WHERE id = ${id}`;
  } catch (error) {
    console.error("deleteTripCost failed", error);
    return { ok: false, message: "Couldn't delete. Try again." };
  }
  revalidatePath("/costs");
  return { ok: true };
}

// Not exported: a "use server" file may only export async functions.
const MAX_PEOPLE = 100;

/** Sets how many people the trip total is split between. */
export async function savePeopleCount(
  rawCount: string,
): Promise<TripCostResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  const text = typeof rawCount === "string" ? rawCount.trim() : "";
  const count = Number(text);
  if (!text || !Number.isInteger(count) || count < 1 || count > MAX_PEOPLE) {
    return {
      ok: false,
      message: `Enter a whole number from 1 to ${MAX_PEOPLE}.`,
    };
  }
  try {
    await setPeopleCount(count);
  } catch (error) {
    console.error("savePeopleCount failed", error);
    return { ok: false, message: "Couldn't save. Try again." };
  }
  revalidatePath("/costs");
  return { ok: true };
}
