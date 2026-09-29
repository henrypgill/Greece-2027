import { db } from "@/lib/db";

// Single trip-wide values, stored as text in the settings table by key.
// Starting values are inserted in db.ts.

const PEOPLE_COUNT = "people_count";

/**
 * How many people the trip total is split between, as set by an admin on the
 * Costs page (starts at 10; not derived from attendance sign-ups).
 */
export async function getPeopleCount(): Promise<number> {
  const sql = await db();
  const rows =
    await sql`SELECT value FROM settings WHERE key = ${PEOPLE_COUNT}`;
  return Number(rows[0].value);
}

export async function setPeopleCount(count: number): Promise<void> {
  const sql = await db();
  await sql`
    UPDATE settings SET value = ${String(count)} WHERE key = ${PEOPLE_COUNT}
  `;
}

/** Like getPeopleCount, but logs and returns null on failure. */
export async function loadPeopleCount(): Promise<number | null> {
  try {
    return await getPeopleCount();
  } catch (error) {
    console.error("getPeopleCount failed", error);
    return null;
  }
}
