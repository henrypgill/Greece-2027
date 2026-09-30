import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Neon Postgres, connected to the Vercel project via the Neon integration,
// which sets DATABASE_URL (some setups name it POSTGRES_URL instead).

/** The home page's starting description (admins edit it there). */
const TRIP_DESCRIPTION =
  "A week sailing the Cyclades in July 2027. We pick up the boat on Paros " +
  "and island-hop via Antiparos, Ios, Santorini, Naxos and Mykonos, with " +
  "swim stops in quiet coves along the way and a big party night on " +
  "Mykonos, before heading back to Paros.";

/** Earlier starting descriptions, replaced by TRIP_DESCRIPTION if unedited. */
const OLD_TRIP_DESCRIPTIONS = [
  "A Greek island-hopping boat trip, July 2027.",
  "A week sailing the Cyclades in July 2027. We pick up the boat on Paros " +
    "and island-hop via Antiparos, Ios, Santorini, Naxos and Mykonos, with " +
    "swim stops in quiet coves along the way, before heading back to Paros.",
];

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
    // Whether the boat can plug in at this stop. Added after the table existed.
    await sql`
      ALTER TABLE itinerary_items
      ADD COLUMN IF NOT EXISTS shore_power boolean NOT NULL DEFAULT false
    `;
    // Photo URLs for each stop, shown as a carousel (links to images hosted
    // elsewhere; nothing is uploaded).
    await sql`
      CREATE TABLE IF NOT EXISTS itinerary_images (
        id serial PRIMARY KEY,
        item_id integer NOT NULL
          REFERENCES itinerary_items (id) ON DELETE CASCADE,
        sort_order integer NOT NULL DEFAULT 0,
        url text NOT NULL
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
    // true: the amount is per person (e.g. flights); false: it's split
    // between everyone (e.g. the charter). Added after the table existed.
    await sql`
      ALTER TABLE trip_costs
      ADD COLUMN IF NOT EXISTS per_person boolean NOT NULL DEFAULT false
    `;
    // The "Things to bring" list (see bring-db.ts).
    await sql`
      CREATE TABLE IF NOT EXISTS bring_items (
        id serial PRIMARY KEY,
        sort_order integer NOT NULL,
        item text NOT NULL,
        note text NOT NULL DEFAULT ''
      )
    `;
    // Single values for the whole trip, by name (see settings-db.ts).
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key text PRIMARY KEY,
        value text NOT NULL
      )
    `;
    // Starting values; never overwrites one that's been changed.
    await sql`
      INSERT INTO settings (key, value) VALUES
        ('people_count', '10'),
        ('trip_description', ${TRIP_DESCRIPTION})
      ON CONFLICT (key) DO NOTHING
    `;
    // One-off: swap an earlier starting description for the current one,
    // unless an admin has already changed it. Bump the seed name (v3, v4…)
    // whenever TRIP_DESCRIPTION changes, and add the old text above.
    await sql`
      WITH claimed AS (
        INSERT INTO seeds (name) VALUES ('trip-description-v3')
        ON CONFLICT DO NOTHING
        RETURNING name
      )
      UPDATE settings SET value = ${TRIP_DESCRIPTION}
      WHERE key = 'trip_description'
        AND value = ANY(${OLD_TRIP_DESCRIPTIONS}::text[])
        AND EXISTS (SELECT 1 FROM claimed)
    `;
  })().catch((error) => {
    schemaReady = undefined; // retry next time rather than caching the failure
    throw error;
  });
  await schemaReady;
  return sql;
}
