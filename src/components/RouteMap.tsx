"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import "mapbox-gl/dist/mapbox-gl.css";

// Mykonos town (Chora), Greece, as [longitude, latitude].
const MYKONOS_TOWN: [number, number] = [25.3289, 37.4467];
const INITIAL_ZOOM = 15;

export default function RouteMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: import("mapbox-gl").Map | undefined;

    async function init() {
      try {
        // The token comes from the signed-in API, not from the JS bundle.
        const response = await fetch("/api/map-config");
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error("map-config failed");
        const { token } = await response.json();
        if (!token) throw new Error("no token");

        // Loaded on demand because mapbox-gl needs the browser (window).
        const { default: mapboxgl } = await import("mapbox-gl");
        if (cancelled || !containerRef.current) return;
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: MYKONOS_TOWN,
          zoom: INITIAL_ZOOM,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    init();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [router]);

  return (
    <>
      <Box ref={containerRef} sx={{ position: "absolute", inset: 0 }} />
      {failed && (
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
            The map couldn&apos;t be loaded. Check the Mapbox token and try
            again.
          </Typography>
        </Box>
      )}
    </>
  );
}
