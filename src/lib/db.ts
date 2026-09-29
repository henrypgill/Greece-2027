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
 * Returns the query function, creating the tables on first use in each server
 * instance. `IF NOT EXISTS` makes this safe to run repeatedly, so there's no
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
  })().catch((error) => {
    schemaReady = undefined; // retry next time rather than caching the failure
    throw error;
  });
  await schemaReady;
  return sql;
}
