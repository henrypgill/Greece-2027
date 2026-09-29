import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TripCalendar from "@/components/TripCalendar";
import TripWeather from "@/components/TripWeather";
import {
  formatCost,
  formatDay,
  greekDayKey,
  itemTotalCost,
} from "@/data/itinerary";
import { costPerPerson } from "@/data/trip-costs";
import { loadItinerary } from "@/lib/itinerary-db";
import { isAdminSession } from "@/lib/session";
import { loadPeopleCount, loadTripDescription } from "@/lib/settings-db";
import { loadTripCosts } from "@/lib/trip-costs-db";
import TripDescription from "./TripDescription";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function HomePage() {
  await connection(); // read fresh from the database on every request
  const [itinerary, tripCosts, peopleCount, description, isAdmin] =
    await Promise.all([
      loadItinerary(),
      loadTripCosts(),
      loadPeopleCount(),
      loadTripDescription(),
      isAdminSession(),
    ]);
  if (
    !itinerary ||
    !tripCosts ||
    peopleCount === null ||
    description === null
  ) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The trip details couldn&apos;t be loaded.
      </Alert>
    );
  }

  const perPerson = costPerPerson(
    tripCosts,
    itinerary.reduce((sum, item) => sum + itemTotalCost(item), 0),
    peopleCount,
  );

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <TripDescription description={description} isAdmin={isAdmin} />

      <Divider />

      <Box>
        <Typography variant="overline" color="text.secondary">
          Cost per person
        </Typography>
        <Typography variant="h5" component="p">
          {formatCost(perPerson)}
        </Typography>
        {/* A plain link: this is a server component, so it can't pass
            next/link to MUI's (client) Button as its component. */}
        <Button href="/costs" size="small" sx={{ ml: -0.5, mt: 0.5 }}>
          See the breakdown
        </Button>
      </Box>

      <Divider />

      <TripDates itinerary={itinerary} />

      <Divider />

      <TripWeather />
    </Stack>
  );
}

function TripDates({
  itinerary,
}: {
  itinerary: NonNullable<Awaited<ReturnType<typeof loadItinerary>>>;
}) {
  if (itinerary.length === 0) {
    return <Typography color="text.secondary">No trip dates yet.</Typography>;
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
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Dates
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
