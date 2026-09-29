import { db } from "@/lib/db";

// Single trip-wide values, stored as text in the settings table by key.
// Starting values are inserted in db.ts, so every key always has a value.

type SettingKey = "people_count" | "trip_description";

async function getSetting(key: SettingKey): Promise<string> {
  const sql = await db();
  const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return rows[0].value as string;
}

async function setSetting(key: SettingKey, value: string): Promise<void> {
  const sql = await db();
  await sql`UPDATE settings SET value = ${value} WHERE key = ${key}`;
}

/** Runs `load`, but logs and returns null on failure, for pages to show an error. */
async function orNull<T>(
  name: string,
  load: () => Promise<T>,
): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    console.error(`${name} failed`, error);
    return null;
  }
}

/**
 * How many people shared costs are split between, as set by an admin on the
 * Costs page (starts at 10; not derived from attendance sign-ups).
 */
export async function getPeopleCount(): Promise<number> {
  return Number(await getSetting("people_count"));
}

export function setPeopleCount(count: number): Promise<void> {
  return setSetting("people_count", String(count));
}

export function loadPeopleCount(): Promise<number | null> {
  return orNull("getPeopleCount", getPeopleCount);
}

/** Markdown shown at the top of the home page, edited by an admin there. */
export function getTripDescription(): Promise<string> {
  return getSetting("trip_description");
}

export function setTripDescription(description: string): Promise<void> {
  return setSetting("trip_description", description);
}

export function loadTripDescription(): Promise<string | null> {
  return orNull("getTripDescription", getTripDescription);
}
