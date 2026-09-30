import { TRIP_COSTS_SEED, type TripCost } from "@/data/trip-costs";
import { db } from "@/lib/db";

const SEED_NAME = "trip-costs-v1";

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
      per_person: c.perPerson,
    }));
    await sql`
      WITH claimed AS (
        INSERT INTO seeds (name) VALUES (${SEED_NAME})
        ON CONFLICT DO NOTHING
        RETURNING name
      )
      INSERT INTO trip_costs (sort_order, item, cost, per_person)
      SELECT c.sort_order, c.item, c.cost, c.per_person
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
        AS c (sort_order integer, item text, cost numeric, per_person boolean)
      WHERE EXISTS (SELECT 1 FROM claimed)
    `;
    // One-off, for databases seeded before per_person existed: flights were
    // meant to be per person.
    await sql`
      WITH claimed AS (
        INSERT INTO seeds (name) VALUES ('trip-costs-flights-per-person')
        ON CONFLICT DO NOTHING
        RETURNING name
      )
      UPDATE trip_costs SET per_person = true
      WHERE item = 'Flights' AND EXISTS (SELECT 1 FROM claimed)
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
    SELECT id, item, cost, per_person, description FROM trip_costs
    ORDER BY sort_order, id
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    item: row.item as string,
    cost: Number(row.cost),
    perPerson: row.per_person === true,
    description: row.description as string,
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
