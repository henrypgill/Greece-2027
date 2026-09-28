"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import "mapbox-gl/dist/mapbox-gl.css";

// Mykonos town (Chora), Greece, as [longitude, latitude].
const MYKONOS_TOWN: [number, number] = [25.3289, 37.4467];
const INITIAL_ZOOM = 15;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function RouteMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;

    let cancelled = false;
    let map: import("mapbox-gl").Map | undefined;

    // Loaded on demand because mapbox-gl needs the browser (window).
    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: MYKONOS_TOWN,
        zoom: INITIAL_ZOOM,
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography color="text.secondary">
          Map unavailable: set NEXT_PUBLIC_MAPBOX_TOKEN to your Mapbox public
          access token.
        </Typography>
      </Box>
    );
  }

  return <Box ref={containerRef} sx={{ position: "absolute", inset: 0 }} />;
}
