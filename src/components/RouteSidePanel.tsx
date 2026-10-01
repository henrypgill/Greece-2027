"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StopDetails from "@/components/StopDetails";
import {
  STOP_TYPES,
  formatDateTime,
  getLegs,
  type ItineraryItem,
} from "@/data/itinerary";

export const SIDE_PANEL_WIDTH = 380;

/** A stop's number, in its stop type's colour like the map pins. */
function StopNumber({ item, number }: { item: ItineraryItem; number: number }) {
  return (
    <Avatar
      title={STOP_TYPES[item.stopType].label}
      sx={{
        width: 28,
        height: 28,
        fontSize: 14,
        bgcolor: STOP_TYPES[item.stopType].color,
        color: STOP_TYPES[item.stopType].textColor,
      }}
    >
      {number}
    </Avatar>
  );
}

/**
 * The Route map's panel on desktop, beside the map (phones get the
 * full-screen `StopPopup` instead). With no stop selected it lists every
 * stop; selecting one, here or by clicking its pin, shows its details (the
 * same `StopDetails` as everywhere else, so no costs) with previous/next.
 */
export default function RouteSidePanel({
  itinerary,
  selected,
  onSelect,
}: {
  itinerary: ItineraryItem[];
  /** The open stop's index in the itinerary, or null for the list. */
  selected: number | null;
  /** Select a stop by index (null goes back to the list). */
  onSelect: (index: number | null) => void;
}) {
  const item = selected === null ? undefined : itinerary[selected];

  return (
    <Box
      component="aside"
      aria-label="Stops"
      sx={{
        width: SIDE_PANEL_WIDTH,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {item && selected !== null ? (
        <>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              px: 1,
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <IconButton
              aria-label="Back to all stops"
              onClick={() => onSelect(null)}
            >
              <ArrowBackIcon />
            </IconButton>
            <StopNumber item={item} number={selected + 1} />
            <Typography
              variant="h6"
              component="h2"
              sx={{ flex: 1, lineHeight: 1.2, minWidth: 0 }}
            >
              {item.title}
            </Typography>
          </Stack>

          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            <StopDetails
              item={item}
              number={selected + 1}
              nextLeg={getLegs(itinerary)[selected]}
            />
          </Box>

          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              p: 1,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              startIcon={<ChevronLeftIcon />}
              disabled={selected === 0}
              onClick={() => onSelect(selected - 1)}
            >
              Previous
            </Button>
            <Button
              endIcon={<ChevronRightIcon />}
              disabled={selected === itinerary.length - 1}
              onClick={() => onSelect(selected + 1)}
            >
              Next
            </Button>
          </Stack>
        </>
      ) : (
        <>
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography variant="h6" component="h2">
              Stops
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pick a stop here or on the map for its details.
            </Typography>
          </Box>
          <List sx={{ flex: 1, overflowY: "auto" }}>
            {itinerary.map((stop, index) => (
              <ListItemButton key={stop.id} onClick={() => onSelect(index)}>
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <StopNumber item={stop} number={index + 1} />
                </ListItemAvatar>
                <ListItemText
                  primary={stop.title}
                  secondary={formatDateTime(stop.start)}
                />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </Box>
  );
}
