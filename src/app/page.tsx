import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TripCalendar from "@/components/TripCalendar";
import { formatDay, greekDayKey } from "@/data/itinerary";
import { loadItinerary } from "@/lib/itinerary-db";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function HomePage() {
  await connection(); // read fresh from the database on every request
  const itinerary = await loadItinerary();
  if (!itinerary) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The trip dates couldn&apos;t be loaded.
      </Alert>
    );
  }
  if (itinerary.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        No trip dates yet.
      </Typography>
    );
  }

  // The trip runs from the earliest stop start to the latest stop end, as
  // Greek-time calendar days.
  const start = itinerary
    .map((item) => greekDayKey(item.start))
    .reduce((a, b) => (b < a ? b : a));
  const end = itinerary
    .map((item) => greekDayKey(item.end))
    .reduce((a, b) => (b > a ? b : a));
  const days =
    Math.round(
      (Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) /
        DAY_MS,
    ) + 1;

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          The trip
        </Typography>
        <Typography variant="h5" component="p">
          {formatDay(start)} – {formatDay(end)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {days} {days === 1 ? "day" : "days"}
        </Typography>
      </Box>
      <TripCalendar start={start} end={end} />
    </Stack>
  );
}
