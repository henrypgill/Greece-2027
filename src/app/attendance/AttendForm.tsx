"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { addAttendee, type AttendState } from "./actions";

const initialState: AttendState = { status: "idle" };

export default function AttendForm() {
  const [state, formAction, pending] = useActionState(
    addAttendee,
    initialState,
  );

  return (
    <Stack
      component="form"
      action={formAction}
      spacing={2}
      // React resets form fields after every submit. Remounting with the
      // echoed values keeps what was typed after an error (and clears the
      // fields after a success, which echoes nothing).
      key={state.responseId ?? 0}
    >
      <TextField
        name="firstName"
        label="First name"
        autoComplete="given-name"
        required
        defaultValue={state.firstName}
        slotProps={{ htmlInput: { maxLength: 50 } }}
      />
      <TextField
        name="lastName"
        label="Last name"
        autoComplete="family-name"
        required
        defaultValue={state.lastName}
        slotProps={{ htmlInput: { maxLength: 50 } }}
      />
      <Button type="submit" variant="contained" size="large" loading={pending}>
        I&apos;m going
      </Button>
      {state.message && (
        <Alert severity={state.status === "error" ? "error" : "success"}>
          {state.message}
        </Alert>
      )}
    </Stack>
  );
}
