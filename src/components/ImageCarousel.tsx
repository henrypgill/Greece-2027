"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

/**
 * Swipeable photos for one itinerary stop: a horizontal scroll-snap strip
 * (native swiping on phones), arrows and dots. The images are links to
 * pictures hosted elsewhere, so they're plain <img> tags.
 */
export default function ImageCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Set<number>>(new Set());

  const goTo = (i: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const target = Math.max(0, Math.min(images.length - 1, i));
    strip.scrollTo({ left: target * strip.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const strip = stripRef.current;
    if (!strip || strip.clientWidth === 0) return;
    setIndex(Math.round(strip.scrollLeft / strip.clientWidth));
  };

  const many = images.length > 1;

  return (
    <Box>
      <Box sx={{ position: "relative" }}>
        <Box
          ref={stripRef}
          onScroll={onScroll}
          sx={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            borderRadius: 1,
            bgcolor: "action.hover",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {images.map((src, i) => (
            <Box
              key={`${i}-${src}`}
              sx={{
                flex: "0 0 100%",
                aspectRatio: "4 / 3",
                scrollSnapAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {broken.has(i) ? (
                <Typography variant="caption" color="text.secondary">
                  This photo couldn&apos;t be loaded.
                </Typography>
              ) : (
                // Remote images from anywhere, so not next/image (which needs
                // every host listed in next.config).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={`${title}, photo ${i + 1} of ${images.length}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setBroken((b) => new Set(b).add(i))}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </Box>
          ))}
        </Box>

        {many && (
          <>
            <IconButton
              aria-label="Previous photo"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              size="small"
              sx={arrowSx("left")}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              aria-label="Next photo"
              onClick={() => goTo(index + 1)}
              disabled={index === images.length - 1}
              size="small"
              sx={arrowSx("right")}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}
      </Box>

      {many && (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{ justifyContent: "center", mt: 1 }}
        >
          {images.map((_, i) => (
            <Box
              key={i}
              component="button"
              type="button"
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              sx={{
                width: 8,
                height: 8,
                p: 0,
                border: 0,
                borderRadius: "50%",
                cursor: "pointer",
                bgcolor: i === index ? "primary.main" : "action.disabled",
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

const arrowSx = (side: "left" | "right") => ({
  position: "absolute",
  top: "50%",
  [side]: 4,
  transform: "translateY(-50%)",
  bgcolor: "rgba(255,255,255,0.8)",
  "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
  "&.Mui-disabled": { display: "none" },
});
