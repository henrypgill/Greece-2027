import { db } from "@/lib/db";

export type Attendee = { id: number; firstName: string; lastName: string };

export async function listAttendees(): Promise<Attendee[]> {
  const sql = await db();
  const rows = await sql`
    SELECT id, first_name, last_name FROM attendees ORDER BY created_at, id
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    firstName: row.first_name as string,
    lastName: row.last_name as string,
  }));
}
