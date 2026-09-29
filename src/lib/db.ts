import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Neon Postgres, connected to the Vercel project via the Neon integration,
// which sets DATABASE_URL (some setups name it POSTGRES_URL instead).

let client: NeonQueryFunction<false, false> | undefined;
let schemaReady: Promise<void> | undefined;

function getClient(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client ??= neon(url);
  return client;
}

/**
 * Returns the query function, creating any missing tables on first use in each
 * server instance. `IF NOT EXISTS` makes this safe to run repeatedly, so there's no
 * separate migration step.
 */
export async function db(): Promise<NeonQueryFunction<false, false>> {
  const sql = getClient();
  schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS attendees (
        id serial PRIMARY KEY,
        first_name text NOT NULL,
        last_name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    // One sign-up per name, ignoring case.
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS attendees_name_key
      ON attendees (lower(first_name), lower(last_name))
    `;

    // Which one-off data seeds have been applied (see itinerary-db.ts).
    await sql`
      CREATE TABLE IF NOT EXISTS seeds (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    // Shown in sort_order (ties broken by id); gaps are fine.
    await sql`
      CREATE TABLE IF NOT EXISTS itinerary_items (
        id serial PRIMARY KEY,
        sort_order integer NOT NULL,
        title text NOT NULL,
        start_at timestamptz NOT NULL,
        end_at timestamptz NOT NULL,
        description text NOT NULL DEFAULT '',
        lat double precision NOT NULL,
        lng double precision NOT NULL,
        google_maps_url text,
        CHECK (end_at >= start_at)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS itinerary_costs (
        id serial PRIMARY KEY,
        item_id integer NOT NULL
          REFERENCES itinerary_items (id) ON DELETE CASCADE,
        sort_order integer NOT NULL DEFAULT 0,
        item text NOT NULL,
        cost numeric(10, 2) NOT NULL
      )
    `;
    // Costs for the trip as a whole (flights, charter…), not any one stop.
    await sql`
      CREATE TABLE IF NOT EXISTS trip_costs (
        id serial PRIMARY KEY,
        sort_order integer NOT NULL,
        item text NOT NULL,
        cost numeric(10, 2) NOT NULL
      )
    `;
  })().catch((error) => {
    schemaReady = undefined; // retry next time rather than caching the failure
    throw error;
  });
  await schemaReady;
  return sql;
}
