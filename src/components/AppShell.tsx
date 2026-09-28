"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import RouteIcon from "@mui/icons-material/Route";
import EventNoteIcon from "@mui/icons-material/EventNote";

// Upper bound of common single-screen phone widths (e.g. iPhone Pro Max).
const MAX_WIDTH = 430;

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: <HomeIcon /> },
  { label: "Route", href: "/route", icon: <RouteIcon /> },
  { label: "Itinerary", href: "/itinerary", icon: <EventNoteIcon /> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The drawer is rendered inside the phone-width shell rather than the
  // browser window, so it stays within the column on wider screens.
  const [shell, setShell] = useState<HTMLDivElement | null>(null);

  const title =
    pathname === "/"
      ? "Greece 2027"
      : (NAV_ITEMS.find((item) => item.href === pathname)?.label ??
        "Greece 2027");

  return (
    <Box
      ref={setShell}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxWidth: MAX_WIDTH,
        mx: "auto",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <AppBar position="static" sx={{ flexShrink: 0 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="h1" noWrap>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        container={shell}
        slotProps={{
          root: { container: shell, disableScrollLock: true },
          backdrop: { sx: { position: "absolute" } },
          paper: { sx: { position: "absolute", width: 260 } },
        }}
        sx={{ position: "absolute" }}
      >
        <Toolbar>
          <Typography variant="h6" component="p" noWrap>
            Greece 2027
          </Typography>
        </Toolbar>
        <List component="nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={pathname === item.href}
              onClick={() => setOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flex: 1, overflowY: "auto" }}>
        {children}
      </Box>
    </Box>
  );
}
