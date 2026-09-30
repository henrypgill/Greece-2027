import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// Typical weather for the trip: long-term averages for mid-to-late July in
// the Cyclades (Paros, Ios, Santorini, Naxos, Mykonos), researched in
// September 2026 (Greeka, Weather2Travel, Weather Atlas). Not a forecast.
// Static on purpose; update the figures here if the dates or islands change
// a lot.

const STATS = [
  { label: "Daytime", value: "27–30°C" },
  { label: "Night", value: "21–23°C" },
  { label: "Sea", value: "23–25°C" },
  { label: "Sunshine", value: "13–14 h a day" },
];

export default function TripWeather() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Likely weather
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Typical for mid-to-late July in the Cyclades. Long-term averages, not
          a forecast.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
        }}
      >
        {STATS.map((s) => (
          <Box
            key={s.label}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {s.label}
            </Typography>
            <Typography variant="h6" component="p">
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
