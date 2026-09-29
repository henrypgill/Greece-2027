"use client";

import { useState, useTransition } from "react";
import Markdown from "react-markdown";
import Alert from "@mui/material/Alert";
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
import { saveTripDescription } from "./actions";

/** The trip description (markdown) at the top of the home page. */
export default function TripDescription({
  description,
  isAdmin,
}: {
  description: string;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <Box
        sx={{
          flex: 1,
          typography: "body1",
          "& > :first-of-type": { mt: 0 },
          "& > :last-child": { mb: 0 },
        }}
      >
        {description ? (
          <Markdown>{description}</Markdown>
        ) : (
          <Typography color="text.secondary">No description yet.</Typography>
        )}
      </Box>
      {isAdmin && (
        <IconButton
          size="small"
          aria-label="Edit trip description"
          onClick={() => setEditing(true)}
          sx={{ mt: -0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
      {editing && (
        <DescriptionDialog
          initial={description}
          onClose={() => setEditing(false)}
        />
      )}
    </Stack>
  );
}

function DescriptionDialog({
  initial,
  onClose,
}: {
  initial: string;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startSaving(async () => {
      try {
        const result = await saveTripDescription(value);
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
      <DialogTitle>Trip description</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="description-form"
          onSubmit={handleSubmit}
          spacing={2}
          sx={{ pt: 1 }}
        >
          <TextField
            label="Description (markdown)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            multiline
            minRows={5}
            autoFocus
            slotProps={{ htmlInput: { maxLength: 5000 } }}
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
          form="description-form"
          variant="contained"
          loading={saving}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
