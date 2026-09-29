"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { CURRENCY_SYMBOL, type StopFormValues } from "@/data/itinerary";
import { deleteStop, saveStop, type StopFormState } from "./actions";

type CostRow = { key: number; item: string; cost: string };
type ImageRow = { key: number; url: string };

let nextKey = 0;
const withKey = (c: { item: string; cost: string }): CostRow => ({
  key: nextKey++,
  ...c,
});

const FORM_ID = "stop-form";

/**
 * Popup form for every field of a stop, plus its cost lines. Admin only (the
 * server actions check that too). Closes itself after a successful save or
 * delete; the page data refreshes from the server.
 */
export default function StopDialog({
  id,
  initialValues,
  onClose,
}: {
  id: number | "new";
  initialValues: StopFormValues;
  onClose: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [costs, setCosts] = useState<CostRow[]>(() =>
    initialValues.costs.map(withKey),
  );
  const [images, setImages] = useState<ImageRow[]>(() =>
    initialValues.images.map((url) => ({ key: nextKey++, url })),
  );
  const [state, setState] = useState<StopFormState>({});
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const busy = saving || deleting;
  const errors = state.errors ?? {};

  const field = (name: keyof Omit<StopFormValues, "costs" | "images">) => ({
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value })),
    error: Boolean(errors[name as keyof typeof errors]),
    helperText: errors[name as keyof typeof errors],
    fullWidth: true,
  });

  const updateCost = (key: number, patch: Partial<CostRow>) =>
    setCosts((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startSaving(async () => {
      try {
        const result = await saveStop(formData);
        if (result.ok) onClose();
        else setState(result);
      } catch {
        setState({ message: "Couldn't reach the server. Try again." });
      }
    });
  }

  function handleDelete() {
    if (id === "new") return;
    if (!window.confirm(`Delete "${initialValues.title}"?`)) return;
    startDeleting(async () => {
      try {
        const result = await deleteStop(id);
        if (result.ok) onClose();
        else setState({ message: result.message });
      } catch {
        setState({ message: "Couldn't reach the server. Try again." });
      }
    });
  }

  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      scroll="paper"
      slotProps={{ paper: { sx: { m: 2, width: "calc(100% - 32px)" } } }}
    >
      <DialogTitle>{id === "new" ? "New stop" : "Edit stop"}</DialogTitle>

      <DialogContent dividers>
        <Stack
          component="form"
          id={FORM_ID}
          onSubmit={handleSubmit}
          spacing={2}
          noValidate
        >
          <input type="hidden" name="id" value={String(id)} />

          <TextField label="Title" required {...field("title")} />

          <TextField
            label="Start (Greek time)"
            type="datetime-local"
            required
            {...field("start")}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End (Greek time)"
            type="datetime-local"
            required
            {...field("end")}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Description (markdown)"
            multiline
            minRows={3}
            {...field("description")}
          />

          <Stack direction="row" spacing={1}>
            <TextField
              label="Latitude"
              required
              {...field("lat")}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
            <TextField
              label="Longitude"
              required
              {...field("lng")}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            Long-press a spot in Google Maps to see its latitude, longitude.
          </Typography>

          <TextField
            label="Google Maps link"
            type="url"
            {...field("googleMapsUrl")}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Costs
            </Typography>
            <Stack spacing={1}>
              {costs.map((row) => (
                <Stack key={row.key} direction="row" spacing={1}>
                  <TextField
                    name="costItem"
                    label="What"
                    size="small"
                    value={row.item}
                    onChange={(e) =>
                      updateCost(row.key, { item: e.target.value })
                    }
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    name="costAmount"
                    label="Amount"
                    size="small"
                    value={row.cost}
                    onChange={(e) =>
                      updateCost(row.key, { cost: e.target.value })
                    }
                    sx={{ flex: 1 }}
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
                  <IconButton
                    aria-label="Remove cost"
                    onClick={() =>
                      setCosts((rows) => rows.filter((r) => r.key !== row.key))
                    }
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            {errors.costs && (
              <Typography variant="caption" color="error">
                {errors.costs}
              </Typography>
            )}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                setCosts((rows) => [...rows, withKey({ item: "", cost: "" })])
              }
              sx={{ mt: 1 }}
            >
              Add cost
            </Button>
          </Box>

          <Box>
            <Typography variant="subtitle2">Photos</Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Links to images already online (e.g. right-click a picture and
              copy its image address). Shown in this order.
            </Typography>
            <Stack spacing={1}>
              {images.map((row) => (
                <Stack
                  key={row.key}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      backgroundImage: row.url
                        ? `url("${row.url.replace(/"/g, "%22")}")`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <TextField
                    name="imageUrl"
                    label="Image URL"
                    size="small"
                    type="url"
                    value={row.url}
                    onChange={(e) =>
                      setImages((rows) =>
                        rows.map((r) =>
                          r.key === row.key ? { ...r, url: e.target.value } : r,
                        ),
                      )
                    }
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    aria-label="Remove photo"
                    onClick={() =>
                      setImages((rows) => rows.filter((r) => r.key !== row.key))
                    }
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            {errors.images && (
              <Typography variant="caption" color="error">
                {errors.images}
              </Typography>
            )}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() =>
                setImages((rows) => [...rows, { key: nextKey++, url: "" }])
              }
              sx={{ mt: 1 }}
            >
              Add photo
            </Button>
          </Box>

          {state.message && <Alert severity="error">{state.message}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        {id !== "new" && (
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
          form={FORM_ID}
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
