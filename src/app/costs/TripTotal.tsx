"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import { formatCost } from "@/data/itinerary";
import { savePeopleCount } from "./actions";

/**
 * The per-person cost at the top of the Costs page: the whole-trip total
 * split between `peopleCount` people. Admins can change the number of people.
 */
export default function TripTotal({
  total,
  peopleCount,
  isAdmin,
}: {
  total: number;
  peopleCount: number;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const people = `${peopleCount} ${peopleCount === 1 ? "person" : "people"}`;

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        Per person
      </Typography>
      <Typography variant="h4" component="p">
        {formatCost(total / peopleCount)}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {formatCost(total)} total · {people}
        </Typography>
        {isAdmin && (
          <IconButton
            size="small"
            aria-label="Set number of people"
            onClick={() => setEditing(true)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {editing && (
        <PeopleDialog initial={peopleCount} onClose={() => setEditing(false)} />
      )}
    </Box>
  );
}

function PeopleDialog({
  initial,
  onClose,
}: {
  initial: number;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await savePeopleCount(value);
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
      <DialogTitle>Number of people</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="people-form"
          onSubmit={handleSubmit}
          noValidate
          spacing={2}
          sx={{ pt: 1 }}
        >
          <TextField
            label="People"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            required
            error={Boolean(error)}
            helperText={error ?? "The trip total is split between this many."}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="people-form"
          variant="contained"
          loading={saving}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
