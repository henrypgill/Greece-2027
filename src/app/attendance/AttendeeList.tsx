"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { removeAttendee, updateAttendee } from "./actions";
import type { Attendee } from "./data";

export default function AttendeeList({
  attendees,
  isAdmin,
}: {
  attendees: Attendee[];
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState<Attendee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [, startRemoving] = useTransition();

  function handleRemove(attendee: Attendee) {
    const name = `${attendee.firstName} ${attendee.lastName}`;
    if (!window.confirm(`Remove ${name} from the list?`)) return;
    setRemovingId(attendee.id);
    startRemoving(async () => {
      try {
        const result = await removeAttendee(attendee.id);
        if (!result.ok) setError(result.message);
      } catch {
        setError("Couldn't reach the server. Try again.");
      } finally {
        setRemovingId(null);
      }
    });
  }

  return (
    <>
      <List dense disablePadding>
        {attendees.map((a) => (
          <ListItem
            key={a.id}
            disableGutters
            secondaryAction={
              isAdmin && (
                <Stack direction="row">
                  <IconButton
                    size="small"
                    aria-label={`Edit ${a.firstName} ${a.lastName}`}
                    onClick={() => setEditing(a)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label={`Remove ${a.firstName} ${a.lastName}`}
                    onClick={() => handleRemove(a)}
                    disabled={removingId === a.id}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )
            }
          >
            <ListItemText primary={`${a.firstName} ${a.lastName}`} />
          </ListItem>
        ))}
      </List>

      {editing && (
        <EditAttendeeDialog
          key={editing.id}
          attendee={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

function EditAttendeeDialog({
  attendee,
  onClose,
}: {
  attendee: Attendee;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState(attendee.firstName);
  const [lastName, setLastName] = useState(attendee.lastName);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await updateAttendee(attendee.id, firstName, lastName);
        if (result.ok) onClose();
        else setError(result.message);
      } catch {
        setError("Couldn't reach the server. Try again.");
      }
    });
  }

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { m: 2, width: "calc(100% - 32px)" } } }}
    >
      <DialogTitle>Edit name</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="attendee-form"
          onSubmit={handleSubmit}
          spacing={2}
          sx={{ pt: 1 }}
        >
          <TextField
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          <TextField
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="attendee-form"
          variant="contained"
          loading={saving}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
