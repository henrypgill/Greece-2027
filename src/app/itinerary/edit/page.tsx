import Link from "next/link";
import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditIcon from "@mui/icons-material/Edit";
import { formatDateTime } from "@/data/itinerary";
import { loadItinerary } from "@/lib/itinerary-db";
import { moveStop } from "./actions";

export default async function EditItineraryPage() {
  await connection();
  const itinerary = await loadItinerary();
  if (!itinerary) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The itinerary couldn&apos;t be loaded.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "space-between", mb: 1 }}
      >
        <Button component={Link} href="/itinerary">
          Done
        </Button>
        <Button
          component={Link}
          href="/itinerary/edit/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add stop
        </Button>
      </Stack>

      {itinerary.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No stops yet.
        </Typography>
      ) : (
        <List disablePadding>
          {itinerary.map((item, index) => (
            <ListItem
              key={item.id}
              disableGutters
              secondaryAction={
                <Stack direction="row">
                  <form action={moveStop.bind(null, item.id, "up")}>
                    <IconButton
                      type="submit"
                      size="small"
                      aria-label={`Move ${item.title} up`}
                      disabled={index === 0}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </form>
                  <form action={moveStop.bind(null, item.id, "down")}>
                    <IconButton
                      type="submit"
                      size="small"
                      aria-label={`Move ${item.title} down`}
                      disabled={index === itinerary.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </form>
                  <IconButton
                    component={Link}
                    href={`/itinerary/edit/${item.id}`}
                    size="small"
                    aria-label={`Edit ${item.title}`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
              sx={{ pr: 15 }}
            >
              <ListItemAvatar sx={{ minWidth: 40 }}>
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
              </ListItemAvatar>
              <ListItemText
                primary={item.title}
                secondary={formatDateTime(item.start)}
                slotProps={{ primary: { noWrap: true } }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
