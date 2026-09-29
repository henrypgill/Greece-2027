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
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EditIcon from "@mui/icons-material/Edit";
import type { BringItem } from "@/lib/bring-db";
import { deleteBringItem, saveBringItem, type BringResult } from "./actions";

type Editing = { id: number | "new"; item: string; note: string } | null;

/** The "Things to bring" list; admins can add, edit and delete items. */
export default function BringList({
  items,
  isAdmin,
}: {
  items: BringItem[];
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState<Editing>(null);

  return (
    <Stack sx={{ p: 2 }} spacing={1}>
      {isAdmin && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => setEditing({ id: "new", item: "", note: "" })}
          sx={{ alignSelf: "flex-end" }}
        >
          Add item
        </Button>
      )}

      {items.length === 0 ? (
        <Typography color="text.secondary">Nothing on the list yet.</Typography>
      ) : (
        <List disablePadding>
          {items.map((b) => (
            <ListItem
              key={b.id}
              disableGutters
              secondaryAction={
                isAdmin && (
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={`Edit ${b.item}`}
                    onClick={() =>
                      setEditing({ id: b.id, item: b.item, note: b.note })
                    }
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircleOutlineIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={b.item} secondary={b.note || undefined} />
            </ListItem>
          ))}
        </List>
      )}

      {editing && (
        <BringDialog
          key={editing.id}
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Stack>
  );
}

function BringDialog({
  initial,
  onClose,
}: {
  initial: NonNullable<Editing>;
  onClose: () => void;
}) {
  const [item, setItem] = useState(initial.item);
  const [note, setNote] = useState(initial.note);
  const [result, setResult] = useState<BringResult | null>(null);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const busy = saving || deleting;
  const error = result && !result.ok ? result : null;

  function run(action: () => Promise<BringResult>, start: typeof startSaving) {
    start(async () => {
      try {
        const res = await action();
        if (res.ok) onClose();
        else setResult(res);
      } catch {
        setResult({
          ok: false,
          message: "Couldn't reach the server. Try again.",
        });
      }
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    run(() => saveBringItem(initial.id, item, note), startSaving);
  }

  function handleDelete() {
    if (initial.id === "new") return;
    const id = initial.id;
    if (!window.confirm(`Delete "${initial.item}"?`)) return;
    run(() => deleteBringItem(id), startDeleting);
  }

  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { m: 2, width: "calc(100% - 32px)" } } }}
    >
      <DialogTitle>
        {initial.id === "new" ? "New item" : "Edit item"}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="bring-form"
          onSubmit={handleSubmit}
          noValidate
          spacing={2}
          sx={{ pt: 1 }}
        >
          <TextField
            label="What to bring"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
            autoFocus={initial.id === "new"}
            error={error?.field === "item"}
            helperText={error?.field === "item" ? error.message : undefined}
          />
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            error={error?.field === "note"}
            helperText={error?.field === "note" ? error.message : undefined}
          />
          {error && !error.field && (
            <Alert severity="error">{error.message}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {initial.id !== "new" && (
          <Button
            color="error"
            onClick={handleDelete}
            loading={deleting}
            disabled={saving}
            sx={{ mr: "auto" }}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="bring-form"
          variant="contained"
          loading={saving}
          disabled={deleting}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
