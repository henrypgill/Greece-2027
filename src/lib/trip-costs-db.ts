import type { CostItem } from "@/data/itinerary";
import { TRIP_COSTS_SEED } from "@/data/trip-costs";
import { db } from "@/lib/db";

const SEED_NAME = "trip-costs-v1";

/** An overall trip cost, with its database id. */
export type TripCost = CostItem & { id: number };

let seeded: Promise<void> | undefined;

/**
 * Fills trip_costs from TRIP_COSTS_SEED the first time the app runs against
 * this database, and never again. One statement, so it's atomic (same
 * approach as the itinerary seed in itinerary-db.ts).
 */
export function ensureTripCostsSeeded(): Promise<void> {
  seeded ??= (async () => {
    const sql = await db();
    const rows = TRIP_COSTS_SEED.map((c, i) => ({
      sort_order: (i + 1) * 10,
      item: c.item,
      cost: c.cost,
    }));
    await sql`
      WITH claimed AS (
        INSERT INTO seeds (name) VALUES (${SEED_NAME})
        ON CONFLICT DO NOTHING
        RETURNING name
      )
      INSERT INTO trip_costs (sort_order, item, cost)
      SELECT c.sort_order, c.item, c.cost
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
        AS c (sort_order integer, item text, cost numeric)
      WHERE EXISTS (SELECT 1 FROM claimed)
    `;
  })().catch((error) => {
    seeded = undefined; // retry next time rather than caching the failure
    throw error;
  });
  return seeded;
}

export async function getTripCosts(): Promise<TripCost[]> {
  await ensureTripCostsSeeded();
  const sql = await db();
  const rows = await sql`
    SELECT id, item, cost FROM trip_costs ORDER BY sort_order, id
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    item: row.item as string,
    cost: Number(row.cost),
  }));
}

/** Like getTripCosts, but logs and returns null on failure. */
export async function loadTripCosts(): Promise<TripCost[] | null> {
  try {
    return await getTripCosts();
  } catch (error) {
    console.error("getTripCosts failed", error);
    return null;
  }
}
