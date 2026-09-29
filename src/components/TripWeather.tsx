import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// Typical weather for the trip: long-term averages for mid-to-late July in
// the Cyclades (Paros, Ios, Santorini, Naxos, Mykonos), researched in
// September 2026 from the sources below. Not a forecast. Static on purpose;
// update the text here if the dates or islands change a lot.

const STATS = [
  { label: "Daytime", value: "27–30°C" },
  { label: "Night", value: "21–23°C" },
  { label: "Sea", value: "23–25°C" },
  { label: "Sunshine", value: "13–14 h a day" },
];

const NOTES = [
  {
    title: "Windy: the meltemi",
    text: "A strong, dry north wind that peaks from mid-July to mid-August. Usually force 5–7 (roughly 17–33 knots), gusting higher. It builds from late morning, is strongest in the afternoon and eases after sunset. It makes the channels between islands rough, so passages may start early or the route may change. It also keeps the heat bearable.",
  },
  {
    title: "Almost no rain",
    text: "July is the driest month: on average about one rainy day with barely any rain.",
  },
  {
    title: "Very strong sun",
    text: "The UV index is around 10 (very high), so sun cream, a hat and sunglasses are a must.",
  },
  {
    title: "Heatwaves happen",
    text: "In 2023, 2024 and 2025 heatwaves hit Greece in mid-to-late July. During the July 2024 one, highs of 35–37°C were forecast for the islands.",
  },
];

const SOURCES = [
  {
    label: "Greeka (Naxos)",
    href: "https://www.greeka.com/cyclades/naxos/weather/",
  },
  {
    label: "Weather2Travel (Santorini)",
    href: "https://www.weather2travel.com/santorini/july/",
  },
  {
    label: "Weather2Travel (Mykonos)",
    href: "https://www.weather2travel.com/mykonos/july/",
  },
  {
    label: "Weather Atlas (UV)",
    href: "https://www.weather-atlas.com/en/greece/santorini-weather-july",
  },
  {
    label: "Sailogy (meltemi)",
    href: "https://www.sailogy.com/en/blog/meltemi-wind-in-greece-what-sailors-need-to-know/",
  },
  {
    label: "Greek City Times (2024 heatwave)",
    href: "https://greekcitytimes.com/2024/07/16/greece-faces-scorching-heatwave-with-peak-temperatures-expected-wednesday-and-thursday",
  },
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

      {NOTES.map((n) => (
        <Box key={n.title}>
          <Typography variant="subtitle2">{n.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {n.text}
          </Typography>
        </Box>
      ))}

      <Typography variant="caption" color="text.secondary">
        Sources:{" "}
        {SOURCES.map((s, i) => (
          <span key={s.href}>
            {i > 0 && ", "}
            <Link href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </Link>
          </span>
        ))}
      </Typography>
    </Stack>
  );
}
