import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import { loadBringItems } from "@/lib/bring-db";
import { isAdminSession } from "@/lib/session";
import BringList from "./BringList";

export default async function BringPage() {
  await connection(); // read fresh from the database on every request
  const [items, isAdmin] = await Promise.all([
    loadBringItems(),
    isAdminSession(),
  ]);
  if (!items) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The list couldn&apos;t be loaded.
      </Alert>
    );
  }
  return <BringList items={items} isAdmin={isAdmin} />;
}
