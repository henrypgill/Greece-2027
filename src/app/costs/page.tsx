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
  costForGroup,
  costPerPerson,
  costShareLabel,
  formatCost,
  formatDay,
  groupByDay,
  type CostItem,
} from "@/data/itinerary";
import { loadItinerary } from "@/lib/itinerary-db";
import { isAdminSession } from "@/lib/session";
import { loadPeopleCount } from "@/lib/settings-db";
import { loadTripCosts } from "@/lib/trip-costs-db";
import TripCosts from "./TripCosts";
import TripTotal from "./TripTotal";

function CostRows({
  costs,
  peopleCount,
}: {
  costs: CostItem[];
  peopleCount: number;
}) {
  return costs.map((cost, i) => (
    <TableRow key={i}>
      <TableCell sx={{ pl: 0 }}>{cost.item}</TableCell>
      <TableCell align="right" sx={{ pr: 0 }}>
        {formatCost(cost.cost)}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          {costShareLabel(cost, peopleCount)}
        </Typography>
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
  if (!itinerary || !tripCosts || peopleCount === null) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The costs couldn&apos;t be loaded.
      </Alert>
    );
  }
  const allCosts = [...tripCosts, ...itinerary.flatMap((item) => item.costs)];
  const days = groupByDay(itinerary);

  // Phones: one column. Desktop: the totals and overall costs on the left,
  // day by day on the right.
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: { xs: 3, md: 6 },
        alignItems: "start",
        maxWidth: 1200,
        mx: "auto",
        p: { xs: 2, md: 4 },
      }}
    >
      <Stack spacing={3}>
        <TripTotal
          perPerson={costPerPerson(allCosts, peopleCount)}
          peopleCount={peopleCount}
          isAdmin={isAdmin}
        />

        <Divider />

        <Box>
          <TripCosts
            costs={tripCosts}
            peopleCount={peopleCount}
            isAdmin={isAdmin}
          />
        </Box>
      </Stack>

      <Divider sx={{ display: { md: "none" } }} />

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
                      <CostRows costs={dayCosts} peopleCount={peopleCount} />
                      <SubtotalRow
                        label="Day total for everyone"
                        amount={costForGroup(dayCosts, peopleCount)}
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
    </Box>
  );
}
