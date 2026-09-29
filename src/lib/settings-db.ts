import { db } from "@/lib/db";

// Single trip-wide values, stored as text in the settings table by key.

const PEOPLE_COUNT = "people_count";

/**
 * How many people the trip total is split between, as set by an admin on the
 * Costs page. Null until it's been set. (Not derived from attendance sign-ups.)
 */
export async function getPeopleCount(): Promise<number | null> {
  const sql = await db();
  const rows =
    await sql`SELECT value FROM settings WHERE key = ${PEOPLE_COUNT}`;
  const count = Number(rows[0]?.value);
  return Number.isInteger(count) && count > 0 ? count : null;
}

export async function setPeopleCount(count: number): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO settings (key, value) VALUES (${PEOPLE_COUNT}, ${String(count)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

/** Like getPeopleCount, but logs and returns undefined on failure. */
export async function loadPeopleCount(): Promise<number | null | undefined> {
  try {
    return await getPeopleCount();
  } catch (error) {
    console.error("getPeopleCount failed", error);
    return undefined;
  }
}
