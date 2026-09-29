import { db } from "@/lib/db";

/** An entry on the "Things to bring" list. `note` may be empty. */
export type BringItem = { id: number; item: string; note: string };

const SEED_NAME = "bring-items-v1";

/** What the list starts with; admins change it on the page. */
const STARTER_ITEMS: Omit<BringItem, "id">[] = [
  { item: "Passport", note: "" },
  {
    item: "GHIC / EHIC card",
    note: "Free or reduced-cost healthcare in Greece",
  },
  { item: "Travel insurance details", note: "" },
  { item: "Soft bag", note: "No hard suitcases: they don't fit on the boat" },
  { item: "Swimwear", note: "" },
  { item: "Sun cream", note: "" },
  { item: "Sunglasses and a hat", note: "" },
  { item: "Sandals or deck shoes", note: "Soft soles for on board" },
  { item: "Travel adapter", note: "Greece uses type C/F plugs" },
];

let seeded: Promise<void> | undefined;

/**
 * Fills bring_items with STARTER_ITEMS the first time the app runs against
 * this database, and never again (same approach as the itinerary seed).
 */
export function ensureBringSeeded(): Promise<void> {
  seeded ??= (async () => {
    const sql = await db();
    const rows = STARTER_ITEMS.map((b, i) => ({
      sort_order: (i + 1) * 10,
      ...b,
    }));
    await sql`
      WITH claimed AS (
        INSERT INTO seeds (name) VALUES (${SEED_NAME})
        ON CONFLICT DO NOTHING
        RETURNING name
      )
      INSERT INTO bring_items (sort_order, item, note)
      SELECT b.sort_order, b.item, b.note
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
        AS b (sort_order integer, item text, note text)
      WHERE EXISTS (SELECT 1 FROM claimed)
    `;
  })().catch((error) => {
    seeded = undefined; // retry next time rather than caching the failure
    throw error;
  });
  return seeded;
}

export async function getBringItems(): Promise<BringItem[]> {
  await ensureBringSeeded();
  const sql = await db();
  const rows = await sql`
    SELECT id, item, note FROM bring_items ORDER BY sort_order, id
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    item: row.item as string,
    note: row.note as string,
  }));
}

/** Like getBringItems, but logs and returns null on failure. */
export async function loadBringItems(): Promise<BringItem[] | null> {
  try {
    return await getBringItems();
  } catch (error) {
    console.error("getBringItems failed", error);
    return null;
  }
}
