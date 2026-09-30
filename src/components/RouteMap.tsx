"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StopPopup from "@/components/StopPopup";
import StopTypeDot from "@/components/StopTypeDot";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  STOP_TYPE_KEYS,
  STOP_TYPES,
  formatDuration,
  getLegs,
  type GeoLocation,
  type ItineraryItem,
  type StopType,
} from "@/data/itinerary";
import theme from "@/theme";

const PIN_SIZE = 28;
const ROUTE_COLOR = theme.palette.primary.main;

const toLngLat = ({ lng, lat }: GeoLocation): [number, number] => [lng, lat];

/** A round, numbered map pin in its stop type's colour. */
function createPinElement(number: number, type: StopType): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = String(number);
  Object.assign(el.style, {
    width: `${PIN_SIZE}px`,
    height: `${PIN_SIZE}px`,
    borderRadius: "50%",
    background: STOP_TYPES[type].color,
    color: STOP_TYPES[type].textColor,
    border: "2px solid #fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    font: `500 14px ${theme.typography.fontFamily}`,
    cursor: "pointer",
  });
  return el;
}

/** A right-pointing arrowhead, drawn once and rotated along each leg by Mapbox. */
function createArrowImage(): ImageData {
  const size = 48; // drawn at 2x, displayed at 24px
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.moveTo(size * 0.25, size * 0.2);
  ctx.lineTo(size * 0.8, size * 0.5);
  ctx.lineTo(size * 0.25, size * 0.8);
  ctx.closePath();
  ctx.fillStyle = ROUTE_COLOR;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
}

export default function RouteMap({
  itinerary,
}: {
  itinerary: ItineraryItem[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // Index of the stop whose details are open, from tapping its pin.
  const [selected, setSelected] = useState<number | null>(null);
  // The popup covers the page area (like the menu drawer, it stays inside
  // the phone-width column rather than the whole browser window).
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);

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

        // Start zoomed to fit every stop on the itinerary.
        const bounds = new mapboxgl.LngLatBounds();
        itinerary.forEach((item) => bounds.extend(toLngLat(item.location)));

        const mapInstance = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          bounds,
          fitBoundsOptions: { padding: 60 },
        });
        map = mapInstance;

        // Later markers draw on top of earlier ones, so add them last-first:
        // where pins overlap (e.g. a trip ending where it started), the
        // lower number shows on top.
        itinerary
          .map((item, index) => ({ item, index }))
          .reverse()
          .forEach(({ item, index }) => {
            const pin = createPinElement(index + 1, item.stopType);
            pin.setAttribute("role", "button");
            pin.setAttribute("aria-label", `${index + 1}. ${item.title}`);
            pin.addEventListener("click", () => setSelected(index));
            new mapboxgl.Marker({ element: pin })
              .setLngLat(toLngLat(item.location))
              .addTo(mapInstance);
          });

        // One straight line per leg, with an arrowhead at its midpoint
        // pointing towards the next item.
        mapInstance.on("load", () => {
          mapInstance.addImage("route-arrow", createArrowImage(), {
            pixelRatio: 2,
          });
          mapInstance.addSource("route-legs", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: getLegs(itinerary).map((leg) => ({
                type: "Feature",
                properties: {
                  from: leg.fromIndex + 1,
                  to: leg.toIndex + 1,
                  duration: formatDuration(leg.durationMs),
                },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    toLngLat(leg.from.location),
                    toLngLat(leg.to.location),
                  ],
                },
              })),
            },
          });
          mapInstance.addLayer({
            id: "route-legs-line",
            type: "line",
            source: "route-legs",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": ROUTE_COLOR,
              "line-width": 3,
              "line-opacity": 0.8,
            },
          });
          mapInstance.addLayer({
            id: "route-legs-arrow",
            type: "symbol",
            source: "route-legs",
            layout: {
              "symbol-placement": "line-center",
              "icon-image": "route-arrow",
              "icon-rotation-alignment": "map",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            },
          });
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
  }, [router, itinerary]);

  return (
    <Box ref={setFrame} sx={{ position: "absolute", inset: 0 }}>
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

      {/* Key to the pin colours: just the types used on this trip. */}
      {!failed && (
        <Box
          sx={{
            position: "absolute",
            left: 8,
            bottom: 32,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: "rgba(255,255,255,0.9)",
            boxShadow: 1,
            pointerEvents: "none",
          }}
        >
          {STOP_TYPE_KEYS.filter((key) =>
            itinerary.some((item) => item.stopType === key),
          ).map((key) => (
            <Box
              key={key}
              sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
            >
              <StopTypeDot type={key} size={10} />
              <Typography variant="caption">{STOP_TYPES[key].label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <StopPopup
        itinerary={itinerary}
        index={selected}
        onClose={() => setSelected(null)}
        container={frame}
      />
    </Box>
  );
}
