"use client";

import { alpha, createTheme, type Shadows } from "@mui/material/styles";

// Softer, more diffuse shadows than MUI's defaults (which read as "boxy").
// MUI expects exactly 25 levels; 0 is none, and depth grows gently from there.
const shadows = [
  "none",
  ...Array.from({ length: 24 }, (_, i) => {
    const level = i + 1;
    const y = Math.round(1 + level * 0.75);
    const blur = Math.round(4 + level * 2.5);
    const opacity = Math.min(0.06 + level * 0.004, 0.14);
    return `0 ${y}px ${blur}px rgba(16, 24, 40, ${opacity}), 0 1px 2px rgba(16, 24, 40, 0.04)`;
  }),
] as Shadows;

// Corner radii, larger for larger surfaces. `shape.borderRadius` is the base
// unit: inputs, alerts and menus use it as-is, and `sx={{ borderRadius: 1 }}`
// elsewhere in the app means one unit.
const RADIUS = {
  base: 12,
  card: 16,
  dialog: 24,
  pill: 999,
};

let theme = createTheme({
  cssVariables: true,
  shape: { borderRadius: RADIUS.base },
  shadows,
  palette: {
    // A faint cool tint behind the page so white surfaces (itinerary cards,
    // inputs, dialogs) stand out without heavy borders or shadows.
    background: { default: "#f5f7fa", paper: "#ffffff" },
  },
  typography: {
    fontFamily: "var(--font-poppins), Poppins, Helvetica, Arial, sans-serif",
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
});

theme = createTheme(theme, {
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: RADIUS.pill, paddingInline: 16 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS.dialog,
          // Full-screen dialogs (the Route map's stop popup) stay square.
          variants: [{ props: { fullScreen: true }, style: { borderRadius: 0 } }],
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          variants: [
            {
              props: { anchor: "left" },
              style: {
                borderTopRightRadius: RADIUS.dialog,
                borderBottomRightRadius: RADIUS.dialog,
              },
            },
          ],
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.base,
          marginInline: 8,
          marginBlock: 2,
          "&.Mui-selected": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
          },
          "&.Mui-selected:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.16),
          },
        },
      },
    },
    // Itinerary rows: separate rounded cards instead of a ruled list. The
    // rows pass `square`, but a root radius here applies regardless.
    MuiAccordion: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          margin: 8,
          borderRadius: RADIUS.card,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          "&::before": { display: "none" },
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: { root: { borderRadius: RADIUS.base } },
    },
  },
});

export default theme;
