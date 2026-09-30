"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import {
  CURRENCY_SYMBOL,
  costForGroup,
  costShareLabel,
  formatCost,
} from "@/data/itinerary";
import type { TripCost } from "@/data/trip-costs";
import { deleteTripCost, saveTripCost, type TripCostResult } from "./actions";

type Editing = {
  id: number | "new";
  item: string;
  cost: string;
  perPerson: boolean;
  description: string;
} | null;

/** The "Overall trip costs" table; admins can add, edit and delete rows. */
export default function TripCosts({
  costs,
  peopleCount,
  isAdmin,
}: {
  costs: TripCost[];
  peopleCount: number;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState<Editing>(null);

  return (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="h6" component="h2">
          Overall trip costs
        </Typography>
        {isAdmin && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() =>
              setEditing({
                id: "new",
                item: "",
                cost: "",
                perPerson: false,
                description: "",
              })
            }
          >
            Add cost
          </Button>
        )}
      </Stack>

      <Table size="small">
        <TableBody>
          {costs.map((c) => (
            <TableRow key={c.id}>
              <TableCell sx={{ pl: 0 }}>
                {c.item}
                {c.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", whiteSpace: "pre-line" }}
                  >
                    {c.description}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right" sx={{ pr: isAdmin ? 1 : 0 }}>
                {formatCost(c.cost)}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {costShareLabel(c, peopleCount)}
                </Typography>
              </TableCell>
              {isAdmin && (
                <TableCell padding="none" align="right" sx={{ width: 40 }}>
                  <IconButton
                    size="small"
                    aria-label={`Edit ${c.item}`}
                    onClick={() =>
                      setEditing({
                        id: c.id,
                        item: c.item,
                        cost: String(c.cost),
                        perPerson: c.perPerson,
                        description: c.description,
                      })
                    }
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
          <TableRow>
            <TableCell sx={{ pl: 0, fontWeight: 500, border: 0 }}>
              Subtotal for everyone
            </TableCell>
            <TableCell
              align="right"
              sx={{ pr: isAdmin ? 1 : 0, fontWeight: 500, border: 0 }}
            >
              {formatCost(costForGroup(costs, peopleCount))}
            </TableCell>
            {isAdmin && <TableCell sx={{ border: 0 }} />}
          </TableRow>
        </TableBody>
      </Table>

      {editing && (
        <TripCostDialog
          key={editing.id}
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function TripCostDialog({
  initial,
  onClose,
}: {
  initial: NonNullable<Editing>;
  onClose: () => void;
}) {
  const [item, setItem] = useState(initial.item);
  const [cost, setCost] = useState(initial.cost);
  const [perPerson, setPerPerson] = useState(initial.perPerson);
  const [description, setDescription] = useState(initial.description);
  const [result, setResult] = useState<TripCostResult | null>(null);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const busy = saving || deleting;
  const error = result && !result.ok ? result : null;

  function run(
    action: () => Promise<TripCostResult>,
    start: typeof startSaving,
  ) {
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
    run(
      () => saveTripCost(initial.id, item, cost, perPerson, description),
      startSaving,
    );
  }

  function handleDelete() {
    if (initial.id === "new") return;
    const id = initial.id;
    if (!window.confirm(`Delete "${initial.item}"?`)) return;
    run(() => deleteTripCost(id), startDeleting);
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
        {initial.id === "new" ? "New cost" : "Edit cost"}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="trip-cost-form"
          onSubmit={handleSubmit}
          noValidate
          spacing={2}
          sx={{ pt: 1 }}
        >
          <TextField
            label="What"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            required
            autoFocus={initial.id === "new"}
            error={error?.field === "item"}
            helperText={error?.field === "item" ? error.message : undefined}
          />
          <TextField
            label="Amount"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            required
            error={error?.field === "cost"}
            helperText={error?.field === "cost" ? error.message : undefined}
            slotProps={{
              htmlInput: { inputMode: "decimal" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {CURRENCY_SYMBOL}
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            error={error?.field === "description"}
            helperText={
              error?.field === "description" ? error.message : undefined
            }
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={perPerson}
                onChange={(e) => setPerPerson(e.target.checked)}
              />
            }
            label={
              perPerson
                ? "Per person: everyone pays this amount"
                : "Shared: this amount is split between everyone"
            }
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
          form="trip-cost-form"
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
