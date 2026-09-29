import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import RouteMap from "@/components/RouteMap";
import { loadItinerary } from "@/lib/itinerary-db";

export default async function RoutePage() {
  await connection(); // read fresh from the database on every request
  const itinerary = await loadItinerary();
  if (!itinerary) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The itinerary couldn&apos;t be loaded.
      </Alert>
    );
  }
  if (itinerary.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        The itinerary has no stops yet.
      </Alert>
    );
  }
  return <RouteMap itinerary={itinerary} />;
}
