"use client";

import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import StopDetails from "@/components/StopDetails";
import { getLegs, type ItineraryItem } from "@/data/itinerary";

/**
 * Full-screen details of one stop (everything but its costs), opened by
 * tapping its pin on the Route map. Rendered inside `container` (the page
 * area) rather than the whole browser window, so it stays within the
 * phone-width column like the menu drawer does.
 */
export default function StopPopup({
  itinerary,
  index,
  onClose,
  container,
}: {
  itinerary: ItineraryItem[];
  /** The open stop's index in the itinerary, or null when closed. */
  index: number | null;
  onClose: () => void;
  container: HTMLElement | null;
}) {
  const item = index === null ? undefined : itinerary[index];

  return (
    <Dialog
      fullScreen
      open={item !== undefined}
      onClose={onClose}
      container={container}
      disableScrollLock
      sx={{ position: "absolute" }}
      slotProps={{
        backdrop: { sx: { position: "absolute" } },
        paper: { sx: { position: "absolute", inset: 0 } },
      }}
    >
      {item && index !== null && (
        <>
          <AppBar position="static" color="default" elevation={0}>
            <Toolbar sx={{ gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: 14,
                  bgcolor: "primary.main",
                }}
              >
                {index + 1}
              </Avatar>
              <Typography
                variant="h6"
                component="h2"
                sx={{ flex: 1, lineHeight: 1.2 }}
              >
                {item.title}
              </Typography>
              <IconButton edge="end" aria-label="Close" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
          <DialogContent>
            <StopDetails
              item={item}
              number={index + 1}
              nextLeg={getLegs(itinerary)[index]}
            />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
