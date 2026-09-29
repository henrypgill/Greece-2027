import { db } from "@/lib/db";

export type Attendee = { firstName: string; lastName: string };

export async function listAttendees(): Promise<Attendee[]> {
  const sql = await db();
  const rows = await sql`
    SELECT first_name, last_name FROM attendees ORDER BY created_at, id
  `;
  return rows.map((row) => ({
    firstName: row.first_name as string,
    lastName: row.last_name as string,
  }));
}
