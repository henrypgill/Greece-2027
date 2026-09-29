import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AttendForm from "./AttendForm";
import { listAttendees, type Attendee } from "./data";

export default async function AttendancePage() {
  await connection(); // always read the list fresh, never at build time

  let attendees: Attendee[] | null = null;
  try {
    attendees = await listAttendees();
  } catch (error) {
    console.error("listAttendees failed", error);
  }

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <Box>
        <Typography variant="h6" component="h2" gutterBottom>
          Are you coming?
        </Typography>
        <AttendForm />
      </Box>

      <Divider />

      <Box>
        <Typography variant="h6" component="h2">
          Who&apos;s going{attendees ? ` (${attendees.length})` : ""}
        </Typography>
        {attendees === null ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            The list couldn&apos;t be loaded.
          </Alert>
        ) : attendees.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nobody yet. Be the first!
          </Typography>
        ) : (
          <List dense disablePadding>
            {attendees.map((a) => (
              <ListItem key={`${a.firstName} ${a.lastName}`} disableGutters>
                <ListItemText primary={`${a.firstName} ${a.lastName}`} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Stack>
  );
}
