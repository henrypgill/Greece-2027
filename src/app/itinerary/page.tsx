import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { loadItinerary } from "@/lib/itinerary-db";
import { isAdminSession } from "@/lib/session";
import ItineraryList from "./ItineraryList";

export default async function ItineraryPage() {
  await connection(); // read fresh from the database on every request
  const isAdmin = await isAdminSession();
  // Admin notes are only loaded (and so only sent to the browser) for admins.
  const itinerary = await loadItinerary({ includeAdminNotes: isAdmin });
  if (!itinerary) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The itinerary couldn&apos;t be loaded.
      </Alert>
    );
  }
  // A single readable column, centred on desktop.
  return (
    <Box sx={{ maxWidth: 820, mx: "auto", py: { md: 2 } }}>
      <ItineraryList itinerary={itinerary} isAdmin={isAdmin} />
    </Box>
  );
}
