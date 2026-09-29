import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import { loadItinerary } from "@/lib/itinerary-db";
import { isAdminSession } from "@/lib/session";
import ItineraryList from "./ItineraryList";

export default async function ItineraryPage() {
  await connection(); // read fresh from the database on every request
  const [itinerary, isAdmin] = await Promise.all([
    loadItinerary(),
    isAdminSession(),
  ]);
  if (!itinerary) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The itinerary couldn&apos;t be loaded.
      </Alert>
    );
  }
  return <ItineraryList itinerary={itinerary} isAdmin={isAdmin} />;
}
