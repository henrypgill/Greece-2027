import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import {
  formatCost,
  formatDay,
  groupByDay,
  itemTotalCost,
  sumCosts,
  type CostItem,
} from "@/data/itinerary";
import { loadItinerary } from "@/lib/itinerary-db";
import { isAdminSession } from "@/lib/session";
import { loadPeopleCount } from "@/lib/settings-db";
import { loadTripCosts } from "@/lib/trip-costs-db";
import TripCosts from "./TripCosts";
import TripTotal from "./TripTotal";

function CostRows({ costs }: { costs: CostItem[] }) {
  return costs.map((cost, i) => (
    <TableRow key={i}>
      <TableCell sx={{ pl: 0 }}>{cost.item}</TableCell>
      <TableCell align="right" sx={{ pr: 0 }}>
        {formatCost(cost.cost)}
      </TableCell>
    </TableRow>
  ));
}

function SubtotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <TableRow>
      <TableCell sx={{ pl: 0, fontWeight: 500, border: 0 }}>{label}</TableCell>
      <TableCell align="right" sx={{ pr: 0, fontWeight: 500, border: 0 }}>
        {formatCost(amount)}
      </TableCell>
    </TableRow>
  );
}

export default async function CostsPage() {
  await connection(); // read fresh from the database on every request
  const [itinerary, tripCosts, peopleCount, isAdmin] = await Promise.all([
    loadItinerary(),
    loadTripCosts(),
    loadPeopleCount(),
    isAdminSession(),
  ]);
  if (!itinerary || !tripCosts || peopleCount === undefined) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The costs couldn&apos;t be loaded.
      </Alert>
    );
  }
  const overallTotal = sumCosts(tripCosts);
  const itineraryTotal = itinerary.reduce(
    (sum, item) => sum + itemTotalCost(item),
    0,
  );
  const days = groupByDay(itinerary);

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <TripTotal
        total={overallTotal + itineraryTotal}
        peopleCount={peopleCount}
        isAdmin={isAdmin}
      />

      <Divider />

      <Box>
        <TripCosts costs={tripCosts} isAdmin={isAdmin} />
      </Box>

      <Divider />

      <Box>
        <Typography variant="h6" component="h2">
          Day by day
        </Typography>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {days.map((day) => {
            const dayCosts = day.items.flatMap(({ item }) => item.costs);
            return (
              <Box key={day.date}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {formatDay(day.date)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {day.items
                    .map(({ number, item }) => `${number}. ${item.title}`)
                    .join(" · ")}
                </Typography>
                {dayCosts.length > 0 ? (
                  <Table size="small">
                    <TableBody>
                      <CostRows costs={dayCosts} />
                      <SubtotalRow
                        label="Day total"
                        amount={sumCosts(dayCosts)}
                      />
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No costs yet.
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
