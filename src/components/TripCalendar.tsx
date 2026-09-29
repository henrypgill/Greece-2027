import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// A plain month-grid calendar (weeks start on Monday) with the trip's days
// highlighted. Days are "YYYY-MM-DD" keys in Greek time, so they compare as
// strings. No interactivity, so this renders on the server.

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const monthFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

const pad = (n: number) => String(n).padStart(2, "0");

/** Every [year, month] (month 1–12) from the start key's to the end key's. */
function monthsBetween(start: string, end: string): [number, number][] {
  let [year, month] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  const months: [number, number][] = [];
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push([year, month]);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

function Month({
  year,
  month,
  start,
  end,
}: {
  year: number;
  month: number;
  start: string;
  end: string;
}) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // 0 = Monday … 6 = Sunday
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
        {monthFormat.format(new Date(Date.UTC(year, month - 1, 15)))}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          rowGap: 0.5,
          textAlign: "center",
        }}
      >
        {WEEKDAYS.map((d, i) => (
          <Typography
            key={i}
            variant="caption"
            color="text.secondary"
            sx={{ pb: 0.5 }}
          >
            {d}
          </Typography>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <Box key={i} />;
          const key = `${year}-${pad(month)}-${pad(day)}`;
          const inTrip = key >= start && key <= end;
          const isEdge = key === start || key === end;
          return (
            <Box
              key={i}
              sx={{
                // A band joining the trip days, rounded at the start and end.
                bgcolor: inTrip ? "primary.light" : undefined,
                color: inTrip ? "primary.contrastText" : undefined,
                borderTopLeftRadius: key === start ? 999 : 0,
                borderBottomLeftRadius: key === start ? 999 : 0,
                borderTopRightRadius: key === end ? 999 : 0,
                borderBottomRightRadius: key === end ? 999 : 0,
              }}
            >
              <Box
                sx={{
                  mx: "auto",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  bgcolor: isEdge ? "primary.main" : undefined,
                  fontWeight: isEdge ? 500 : undefined,
                  typography: "body2",
                }}
              >
                {day}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function TripCalendar({
  start,
  end,
}: {
  /** First day of the trip, "YYYY-MM-DD". */
  start: string;
  /** Last day of the trip, "YYYY-MM-DD". */
  end: string;
}) {
  return (
    <Stack spacing={3}>
      {monthsBetween(start, end).map(([year, month]) => (
        <Month
          key={`${year}-${month}`}
          year={year}
          month={month}
          start={start}
          end={end}
        />
      ))}
    </Stack>
  );
}
