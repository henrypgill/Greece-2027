"use client";

import Markdown from "react-markdown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MapIcon from "@mui/icons-material/Map";
import ImageCarousel from "@/components/ImageCarousel";
import {
  formatDateTime,
  formatDuration,
  type ItineraryItem,
  type Leg,
} from "@/data/itinerary";

/**
 * A stop's details (everything but its costs): times, photos, description,
 * Google Maps link and the travel time to the next stop. Shared by the
 * Itinerary page and the Route map's popup.
 */
export default function StopDetails({
  item,
  number,
  nextLeg,
  timesAction,
}: {
  item: ItineraryItem;
  number: number;
  nextLeg: Leg | undefined;
  /** Shown at the end of the times row (the admin edit button). */
  timesAction?: React.ReactNode;
}) {
  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="body2" color="text.secondary">
          {formatDateTime(item.start)} → {formatDateTime(item.end)}
        </Typography>
        {timesAction}
      </Stack>

      {item.images.length > 0 && (
        <ImageCarousel images={item.images} title={item.title} />
      )}

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
  );
}
