import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import MapIcon from "@mui/icons-material/Map";
import Link from "next/link";
import Markdown from "react-markdown";
import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import { formatDateTime, formatDuration, getLegs } from "@/data/itinerary";
import { loadItinerary } from "@/lib/itinerary-db";

export default async function ItineraryPage() {
  await connection(); // read fresh from the database on every request
  const itinerary = await loadItinerary();
  if (!itinerary) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The itinerary couldn&apos;t be loaded.
      </Alert>
    );
  }
  const legs = getLegs(itinerary);

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ justifyContent: "flex-end", px: 1, py: 0.5 }}
      >
        <Button
          component={Link}
          href="/itinerary/edit"
          startIcon={<EditIcon />}
        >
          Edit itinerary
        </Button>
      </Stack>
      {itinerary.map((item, index) => {
        const number = index + 1;
        const nextLeg = legs[index];

        return (
          <Accordion key={item.id} disableGutters square>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: 14,
                    bgcolor: "primary.main",
                  }}
                >
                  {number}
                </Avatar>
                <Typography sx={{ fontWeight: 500 }}>{item.title}</Typography>
              </Stack>
            </AccordionSummary>

            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  {formatDateTime(item.start)} → {formatDateTime(item.end)}
                </Typography>

                {item.description && (
                  <Box
                    sx={{
                      typography: "body2",
                      "& > :first-of-type": { mt: 0 },
                      "& > :last-child": { mb: 0 },
                    }}
                  >
                    <Markdown>{item.description}</Markdown>
                  </Box>
                )}

                {item.googleMapsUrl && (
                  <Button
                    href={item.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<MapIcon />}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Open in Google Maps
                  </Button>
                )}

                <Button
                  component={Link}
                  href={`/itinerary/edit/${item.id}`}
                  size="small"
                  startIcon={<EditIcon />}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Edit this stop
                </Button>

                {nextLeg && (
                  <Typography variant="caption" color="text.secondary">
                    Then {formatDuration(nextLeg.durationMs)} to #{number + 1}{" "}
                    {nextLeg.to.title}
                  </Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
