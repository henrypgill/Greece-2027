import Box from "@mui/material/Box";
import { STOP_TYPES, type StopType } from "@/data/itinerary";

/** A small dot in a stop type's colour (the same colours as the map pins). */
export default function StopTypeDot({
  type,
  size = 12,
}: {
  type: StopType;
  size?: number;
}) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-block",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: STOP_TYPES[type].color,
        border: "1px solid rgba(0,0,0,0.15)",
      }}
    />
  );
}
