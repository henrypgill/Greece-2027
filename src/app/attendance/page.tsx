import { connection } from "next/server";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
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
    // Phones: one column. Desktop: the form on the left, the list on the right.
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        gap: { xs: 3, md: 6 },
        alignItems: "start",
        maxWidth: 1000,
        mx: "auto",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box>
        <Typography variant="h6" component="h2" gutterBottom>
          Are you coming?
        </Typography>
        <AttendForm />
      </Box>

      <Divider sx={{ display: { md: "none" } }} />

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
    </Box>
  );
}
