import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { isAdminSession } from "@/lib/session";
import AttendeeList from "./AttendeeList";
import AttendForm from "./AttendForm";
import { listAttendees, type Attendee } from "./data";

export default async function AttendancePage() {
  await connection(); // always read the list fresh, never at build time
  const isAdmin = await isAdminSession();

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
          <AttendeeList attendees={attendees} isAdmin={isAdmin} />
        )}
      </Box>
    </Stack>
  );
}
