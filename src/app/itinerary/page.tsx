import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MapIcon from "@mui/icons-material/Map";
import Markdown from "react-markdown";
import {
  ITINERARY,
  formatDateTime,
  formatDuration,
  getLegs,
} from "@/data/itinerary";

export default function ItineraryPage() {
  const legs = getLegs();

  return (
    <Box>
      {ITINERARY.map((item, index) => {
        const number = index + 1;
        const nextLeg = legs[index];

        return (
          <Accordion key={index} disableGutters square>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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
