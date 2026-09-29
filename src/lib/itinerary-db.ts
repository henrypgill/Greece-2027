import type { CostItem, ItineraryItem } from "@/data/itinerary";
import { ITINERARY_SEED } from "@/data/itinerary-seed";
import { db } from "@/lib/db";

const SEED_NAME = "itinerary-v1";

let seeded: Promise<void> | undefined;

/**
 * Fills the itinerary tables from ITINERARY_SEED the first time the app runs
 * against this database, and never again (even if every item is later
 * deleted). It's a single statement, so it's atomic: claiming the seed name in
 * `seeds` and inserting the items and costs all happen together, and a second
 * server instance racing it finds the name already claimed and inserts nothing.
 */
function ensureSeeded(): Promise<void> {
  seeded ??= (async () => {
    const sql = await db();
    const items = ITINERARY_SEED.map((item, index) => ({
      sort_order: (index + 1) * 10,
      title: item.title,
      start_at: item.start,
      end_at: item.end,
      description: item.description,
      lat: item.location.lat,
      lng: item.location.lng,
      google_maps_url: item.googleMapsUrl ?? null,
    }));
    const costs = ITINERARY_SEED.flatMap((item, index) =>
      item.costs.map((cost, costIndex) => ({
        item_sort_order: (index + 1) * 10,
        sort_order: costIndex,
        item: cost.item,
        cost: cost.cost,
      })),
    );
    await sql`
      WITH claimed AS (
        INSERT INTO seeds (name) VALUES (${SEED_NAME})
        ON CONFLICT DO NOTHING
        RETURNING name
      ),
      new_items AS (
        INSERT INTO itinerary_items (
          sort_order, title, start_at, end_at, description, lat, lng,
          google_maps_url
        )
        SELECT sort_order, title, start_at, end_at, description, lat, lng,
          google_maps_url
        FROM jsonb_to_recordset(${JSON.stringify(items)}::jsonb) AS x (
          sort_order integer, title text, start_at timestamptz,
          end_at timestamptz, description text, lat double precision,
          lng double precision, google_maps_url text
        )
        WHERE EXISTS (SELECT 1 FROM claimed)
        RETURNING id, sort_order
      )
      INSERT INTO itinerary_costs (item_id, sort_order, item, cost)
      SELECT new_items.id, c.sort_order, c.item, c.cost
      FROM jsonb_to_recordset(${JSON.stringify(costs)}::jsonb) AS c (
        item_sort_order integer, sort_order integer, item text, cost numeric
      )
      JOIN new_items ON new_items.sort_order = c.item_sort_order
    `;
  })().catch((error) => {
    seeded = undefined; // retry next time rather than caching the failure
    throw error;
  });
  return seeded;
}

function toIso(value: unknown): string {
  return new Date(value as string | Date).toISOString();
}

/** The whole itinerary, in order, with each item's costs. */
export async function getItinerary(): Promise<ItineraryItem[]> {
  await ensureSeeded();
  const sql = await db();
  const rows = await sql`
    SELECT
      i.title, i.start_at, i.end_at, i.description, i.lat, i.lng,
      i.google_maps_url,
      COALESCE(
        json_agg(
          json_build_object('item', c.item, 'cost', c.cost)
          ORDER BY c.sort_order, c.id
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS costs
    FROM itinerary_items i
    LEFT JOIN itinerary_costs c ON c.item_id = i.id
    GROUP BY i.id
    ORDER BY i.sort_order, i.id
  `;
  return rows.map((row) => ({
    title: row.title as string,
    start: toIso(row.start_at),
    end: toIso(row.end_at),
    description: row.description as string,
    location: { lat: Number(row.lat), lng: Number(row.lng) },
    ...(row.google_maps_url
      ? { googleMapsUrl: row.google_maps_url as string }
      : {}),
    costs: (row.costs as { item: string; cost: string | number }[]).map(
      (c): CostItem => ({ item: c.item, cost: Number(c.cost) }),
    ),
  }));
}

/** Like getItinerary, but logs and returns null on failure, for pages to show an error. */
export async function loadItinerary(): Promise<ItineraryItem[] | null> {
  try {
    return await getItinerary();
  } catch (error) {
    console.error("getItinerary failed", error);
    return null;
  }
}
