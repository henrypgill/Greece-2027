"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TRIP_TIME_ZONE } from "@/data/itinerary";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/itinerary-db";
import { hasValidSession } from "@/lib/session";

type Field =
  | "title"
  | "start"
  | "end"
  | "lat"
  | "lng"
  | "googleMapsUrl"
  | "costs";

export type StopFormState = {
  errors?: Partial<Record<Field, string>>;
  message?: string;
};

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Everything that changes the itinerary shows on several pages. */
function refreshPages() {
  revalidatePath("/", "layout");
}

/** Creates a stop (id "new") or updates one, including its cost lines. */
export async function saveStop(
  _prev: StopFormState,
  formData: FormData,
): Promise<StopFormState> {
  if (!(await hasValidSession())) {
    return { message: "Your session has expired. Log in again." };
  }

  const idRaw = text(formData, "id");
  const id = idRaw === "new" ? null : Number(idRaw);
  if (id !== null && !Number.isInteger(id)) {
    return { message: "Unknown stop." };
  }

  const title = text(formData, "title");
  const start = text(formData, "start");
  const end = text(formData, "end");
  const description = text(formData, "description");
  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));
  const googleMapsUrl = text(formData, "googleMapsUrl");
  const costItems = formData.getAll("costItem").map(String);
  const costAmounts = formData.getAll("costAmount").map(String);

  const errors: StopFormState["errors"] = {};
  if (!title) errors.title = "Required.";
  else if (title.length > 100) errors.title = "Keep it under 100 characters.";
  if (!LOCAL_DATE_TIME.test(start)) errors.start = "Required.";
  if (!LOCAL_DATE_TIME.test(end)) errors.end = "Required.";
  else if (!errors.start && end < start) errors.end = "Can't be before start.";
  if (!text(formData, "lat") || !(lat >= -90 && lat <= 90)) {
    errors.lat = "A number from -90 to 90.";
  }
  if (!text(formData, "lng") || !(lng >= -180 && lng <= 180)) {
    errors.lng = "A number from -180 to 180.";
  }
  if (googleMapsUrl && !/^https?:\/\//i.test(googleMapsUrl)) {
    errors.googleMapsUrl = "Should start with https://";
  }

  const costs: { sort_order: number; item: string; cost: number }[] = [];
  costItems.forEach((rawItem, i) => {
    const item = rawItem.trim();
    const rawAmount = (costAmounts[i] ?? "").trim();
    if (!item && !rawAmount) return; // blank row, ignore
    const cost = Number(rawAmount);
    if (!item || !rawAmount || !Number.isFinite(cost)) {
      errors.costs = "Each cost needs a description and an amount.";
      return;
    }
    costs.push({
      sort_order: costs.length,
      item,
      cost: Math.round(cost * 100) / 100,
    });
  });

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Fix the highlighted fields." };
  }

  const url = googleMapsUrl || null;
  const costsJson = JSON.stringify(costs);

  try {
    await ensureSeeded();
    const sql = await db();
    if (id === null) {
      // New stops go at the end.
      await sql`
        WITH new_item AS (
          INSERT INTO itinerary_items (
            sort_order, title, start_at, end_at, description, lat, lng,
            google_maps_url
          )
          VALUES (
            (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM itinerary_items),
            ${title},
            ${start}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            ${end}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            ${description}, ${lat}, ${lng}, ${url}
          )
          RETURNING id
        )
        INSERT INTO itinerary_costs (item_id, sort_order, item, cost)
        SELECT new_item.id, c.sort_order, c.item, c.cost
        FROM new_item, jsonb_to_recordset(${costsJson}::jsonb)
          AS c (sort_order integer, item text, cost numeric)
      `;
    } else {
      // One statement, so the stop and its replaced costs change together.
      await sql`
        WITH updated AS (
          UPDATE itinerary_items SET
            title = ${title},
            start_at = ${start}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            end_at = ${end}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            description = ${description},
            lat = ${lat},
            lng = ${lng},
            google_maps_url = ${url}
          WHERE id = ${id}
          RETURNING id
        ),
        removed AS (
          DELETE FROM itinerary_costs
          WHERE item_id IN (SELECT id FROM updated)
        )
        INSERT INTO itinerary_costs (item_id, sort_order, item, cost)
        SELECT updated.id, c.sort_order, c.item, c.cost
        FROM updated, jsonb_to_recordset(${costsJson}::jsonb)
          AS c (sort_order integer, item text, cost numeric)
      `;
    }
  } catch (error) {
    console.error("saveStop failed", error);
    return { message: "Couldn't save. Try again." };
  }

  refreshPages();
  redirect("/itinerary/edit");
}

// Arguments bound with .bind() arrive from the client, so they're checked too.

export async function deleteStop(id: number): Promise<void> {
  if (!(await hasValidSession())) redirect("/login");
  if (!Number.isInteger(id)) return;
  const sql = await db();
  await sql`DELETE FROM itinerary_items WHERE id = ${id}`;
  refreshPages();
  redirect("/itinerary/edit");
}

/** Swaps a stop with its neighbour, then renumbers everything 10, 20, 30… */
export async function moveStop(
  id: number,
  direction: "up" | "down",
): Promise<void> {
  if (!(await hasValidSession())) redirect("/login");
  if (!Number.isInteger(id) || (direction !== "up" && direction !== "down")) {
    return;
  }
  await ensureSeeded();
  const sql = await db();
  const rows = await sql`
    SELECT id FROM itinerary_items ORDER BY sort_order, id
  `;
  const ids = rows.map((row) => Number(row.id));
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await sql`
    UPDATE itinerary_items AS i
    SET sort_order = x.ord * 10
    FROM unnest(${ids}::integer[]) WITH ORDINALITY AS x (id, ord)
    WHERE i.id = x.id
  `;
  refreshPages();
}
