"use server";

import { revalidatePath } from "next/cache";
import { TRIP_TIME_ZONE } from "@/data/itinerary";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/itinerary-db";
import { isAdminSession } from "@/lib/session";

type Field =
  | "title"
  | "start"
  | "end"
  | "lat"
  | "lng"
  | "googleMapsUrl"
  | "costs"
  | "images";

export type StopFormState = {
  ok?: boolean;
  errors?: Partial<Record<Field, string>>;
  message?: string;
};

/** For actions that either work or return a message to show. */
export type ActionResult = { ok: true } | { ok: false; message: string };

const NOT_ADMIN = "Only admins can do this. Log in with the admin password.";

const MAX_IMAGES = 20;

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
export async function saveStop(formData: FormData): Promise<StopFormState> {
  if (!(await isAdminSession())) return { message: NOT_ADMIN };

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
  // A checkbox: sent as "on" when ticked, left out when not.
  const shorePower = formData.get("shorePower") === "on";
  const imageUrls = formData
    .getAll("imageUrl")
    .map((u) => String(u).trim())
    .filter(Boolean);
  const costItems = formData.getAll("costItem").map(String);
  const costAmounts = formData.getAll("costAmount").map(String);
  // One "1"/"0" per cost row (hidden inputs), so they line up with the rows.
  const costPerPerson = formData.getAll("costPerPerson").map(String);

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

  const costs: {
    sort_order: number;
    item: string;
    cost: number;
    per_person: boolean;
  }[] = [];
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
      per_person: costPerPerson[i] === "1",
    });
  });

  if (imageUrls.length > MAX_IMAGES) {
    errors.images = `Up to ${MAX_IMAGES} photos.`;
  } else if (
    imageUrls.some((u) => u.length > 2000 || !/^https?:\/\/\S+$/i.test(u))
  ) {
    errors.images = "Each photo needs a full link starting with https://";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, message: "Fix the highlighted fields." };
  }

  const url = googleMapsUrl || null;
  const costsJson = JSON.stringify(costs);
  const imagesJson = JSON.stringify(
    imageUrls.map((u, i) => ({ sort_order: i, url: u })),
  );

  try {
    await ensureSeeded();
    const sql = await db();
    if (id === null) {
      // New stops go at the end.
      await sql`
        WITH new_item AS (
          INSERT INTO itinerary_items (
            sort_order, title, start_at, end_at, description, lat, lng,
            google_maps_url, shore_power
          )
          VALUES (
            (SELECT COALESCE(MAX(sort_order), 0) + 10 FROM itinerary_items),
            ${title},
            ${start}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            ${end}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            ${description}, ${lat}, ${lng}, ${url}, ${shorePower}
          )
          RETURNING id
        ),
        new_images AS (
          INSERT INTO itinerary_images (item_id, sort_order, url)
          SELECT new_item.id, m.sort_order, m.url
          FROM new_item, jsonb_to_recordset(${imagesJson}::jsonb)
            AS m (sort_order integer, url text)
        )
        INSERT INTO itinerary_costs (item_id, sort_order, item, cost, per_person)
        SELECT new_item.id, c.sort_order, c.item, c.cost, c.per_person
        FROM new_item, jsonb_to_recordset(${costsJson}::jsonb)
          AS c (sort_order integer, item text, cost numeric, per_person boolean)
      `;
    } else {
      // One statement, so the stop and its replaced costs and photos change
      // together.
      await sql`
        WITH updated AS (
          UPDATE itinerary_items SET
            title = ${title},
            start_at = ${start}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            end_at = ${end}::timestamp AT TIME ZONE ${TRIP_TIME_ZONE},
            description = ${description},
            lat = ${lat},
            lng = ${lng},
            google_maps_url = ${url},
            shore_power = ${shorePower}
          WHERE id = ${id}
          RETURNING id
        ),
        removed AS (
          DELETE FROM itinerary_costs
          WHERE item_id IN (SELECT id FROM updated)
        ),
        removed_images AS (
          DELETE FROM itinerary_images
          WHERE item_id IN (SELECT id FROM updated)
        ),
        new_images AS (
          INSERT INTO itinerary_images (item_id, sort_order, url)
          SELECT updated.id, m.sort_order, m.url
          FROM updated, jsonb_to_recordset(${imagesJson}::jsonb)
            AS m (sort_order integer, url text)
        )
        INSERT INTO itinerary_costs (item_id, sort_order, item, cost, per_person)
        SELECT updated.id, c.sort_order, c.item, c.cost, c.per_person
        FROM updated, jsonb_to_recordset(${costsJson}::jsonb)
          AS c (sort_order integer, item text, cost numeric, per_person boolean)
      `;
    }
  } catch (error) {
    console.error("saveStop failed", error);
    return { message: "Couldn't save. Try again." };
  }

  refreshPages();
  return { ok: true };
}

// Arguments arrive from the client, so they're checked here too.

export async function deleteStop(id: number): Promise<ActionResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (!Number.isInteger(id)) return { ok: false, message: "Unknown stop." };
  try {
    const sql = await db();
    await sql`DELETE FROM itinerary_items WHERE id = ${id}`;
  } catch (error) {
    console.error("deleteStop failed", error);
    return { ok: false, message: "Couldn't delete. Try again." };
  }
  refreshPages();
  return { ok: true };
}

/**
 * Saves a new order: `ids` is every stop's id, in the new order. Renumbers
 * sort_order 10, 20, 30… Refuses if the list doesn't match the stops in the
 * database (e.g. someone else added or deleted one meanwhile).
 */
export async function reorderStops(ids: number[]): Promise<ActionResult> {
  if (!(await isAdminSession())) return { ok: false, message: NOT_ADMIN };
  if (
    !Array.isArray(ids) ||
    !ids.every((id) => Number.isInteger(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return { ok: false, message: "Couldn't save the new order." };
  }
  try {
    await ensureSeeded();
    const sql = await db();
    // One statement: only renumbers if the ids are exactly the current stops.
    const updated = await sql`
      WITH current_ids AS (SELECT array_agg(id ORDER BY id) AS ids
                           FROM itinerary_items),
      wanted AS (SELECT array_agg(x ORDER BY x) AS ids
                 FROM unnest(${ids}::integer[]) AS x)
      UPDATE itinerary_items AS i
      SET sort_order = x.ord * 10
      FROM unnest(${ids}::integer[]) WITH ORDINALITY AS x (id, ord),
           current_ids, wanted
      WHERE i.id = x.id AND current_ids.ids = wanted.ids
      RETURNING i.id
    `;
    if (updated.length !== ids.length) {
      refreshPages();
      return {
        ok: false,
        message: "The itinerary changed meanwhile. Showing the latest version.",
      };
    }
  } catch (error) {
    console.error("reorderStops failed", error);
    return { ok: false, message: "Couldn't save the new order. Try again." };
  }
  refreshPages();
  return { ok: true };
}
