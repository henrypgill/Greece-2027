"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import type { StopFormValues } from "@/lib/itinerary-db";
import { deleteStop, saveStop, type StopFormState } from "./actions";

type CostRow = { key: number; item: string; cost: string };

let nextKey = 0;
const withKey = (c: { item: string; cost: string }): CostRow => ({
  key: nextKey++,
  ...c,
});

const initialState: StopFormState = {};

export default function StopForm({
  id,
  initialValues,
}: {
  id: number | "new";
  initialValues: StopFormValues;
}) {
  const [state, formAction, saving] = useActionState(saveStop, initialState);
  // Fields are controlled so React's post-submit form reset can't wipe what
  // was typed when the server sends back validation errors.
  const [values, setValues] = useState(initialValues);
  const [costs, setCosts] = useState<CostRow[]>(() =>
    initialValues.costs.map(withKey),
  );
  const errors = state.errors ?? {};

  const field = (name: keyof Omit<StopFormValues, "costs">) => ({
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

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        {id === "new" ? "New stop" : "Edit stop"}
      </Typography>

      <Stack component="form" action={formAction} spacing={2}>
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
                        <InputAdornment position="start">€</InputAdornment>
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

        {state.message && <Alert severity="error">{state.message}</Alert>}

        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button component={Link} href="/itinerary/edit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={saving}>
            Save
          </Button>
        </Stack>
      </Stack>

      {id !== "new" && (
        <Box
          component="form"
          action={deleteStop.bind(null, id)}
          onSubmit={(e: React.FormEvent) => {
            if (!window.confirm(`Delete "${initialValues.title}"?`)) {
              e.preventDefault();
            }
          }}
          sx={{ mt: 4 }}
        >
          <Button type="submit" color="error">
            Delete this stop
          </Button>
        </Box>
      )}
    </Box>
  );
}
