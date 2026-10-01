"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
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
import CurrencyPoundIcon from "@mui/icons-material/CurrencyPound";
import GroupIcon from "@mui/icons-material/Group";
import LuggageIcon from "@mui/icons-material/Luggage";
import LogoutIcon from "@mui/icons-material/Logout";

// Upper bound of common single-screen phone widths (e.g. iPhone Pro Max).
// Below the `md` breakpoint (900px) the app is this phone-width column;
// from `md` up it's the desktop layout: full width with a permanent side nav.
const MAX_WIDTH = 430;
const NAV_WIDTH = 240;

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: <HomeIcon /> },
  { label: "Route", href: "/route", icon: <RouteIcon /> },
  { label: "Itinerary", href: "/itinerary", icon: <EventNoteIcon /> },
  { label: "Costs", href: "/costs", icon: <CurrencyPoundIcon /> },
  { label: "Things to bring", href: "/bring", icon: <LuggageIcon /> },
  { label: "Attendance", href: "/attendance", icon: <GroupIcon /> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // The drawer is rendered inside the phone-width shell rather than the
  // browser window, so it stays within the column on wider screens.
  const [shell, setShell] = useState<HTMLDivElement | null>(null);

  // Logging out is also how to switch between the user and admin password.
  async function logOut() {
    setOpen(false);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  // A nav item is active on its own page and any page under it.
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const title =
    pathname === "/"
      ? "Greece 2027"
      : (NAV_ITEMS.find((item) => isActive(item.href))?.label ?? "Greece 2027");

  // The login page is shown on its own, without the top bar and menu.
  if (pathname === "/login") return <>{children}</>;

  // The nav and "Log out", shared by the phone menu drawer and the desktop
  // side nav.
  const navLists = (
    <>
      <List component="nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={isActive(item.href)}
            onClick={() => setOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItemButton onClick={logOut}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Log out" />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box
      ref={setShell}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxWidth: { xs: MAX_WIDTH, md: "none" },
        mx: "auto",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <AppBar position="static" sx={{ flexShrink: 0 }}>
        <Toolbar>
          {/* Phones only: the desktop layout has a permanent side nav. */}
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
            sx={{ mr: 1, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          {/* Desktop: the app name above the side nav, then the page title
              lined up with the content. */}
          <Typography
            variant="h6"
            component="p"
            noWrap
            sx={{
              display: { xs: "none", md: "block" },
              width: NAV_WIDTH - 24, // less the toolbar's left padding
              flexShrink: 0,
            }}
          >
            Greece 2027
          </Typography>
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{
              display: { md: pathname === "/" ? "none" : "block" },
              fontWeight: { md: 500 },
            }}
          >
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
        {navLists}
      </Drawer>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Desktop only: the nav, always visible down the left. */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: NAV_WIDTH,
            flexShrink: 0,
            overflowY: "auto",
            py: 1,
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {navLists}
        </Box>

        <Box
          component="main"
          sx={{ position: "relative", flex: 1, minWidth: 0, overflowY: "auto" }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
