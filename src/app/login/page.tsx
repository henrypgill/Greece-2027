"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function formatWait(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0
    ? `${hours} hour${hours === 1 ? "" : "s"}`
    : `${hours} h ${rest} min`;
}

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (response.status === 429) {
        setError(
          `Too many attempts. Try again in ${formatWait(data.retryAfterSeconds ?? 7200)}.`,
        );
      } else if (response.status === 401) {
        const left = data.remaining as number;
        setError(
          `Incorrect password. ${left} attempt${left === 1 ? "" : "s"} left.`,
        );
      } else if (data.error === "not_configured") {
        // USER_PASSWORD, ADMIN_PASSWORD or AUTH_SECRET is missing in Vercel.
        setError(
          "Login isn't set up on the server yet: the password settings are missing.",
        );
      } else {
        setError("Something went wrong. Try again.");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 2,
        minHeight: "100dvh",
        maxWidth: 430,
        mx: "auto",
        p: 3,
        bgcolor: "background.default",
      }}
    >
      <Typography variant="h4" component="h1">
        Greece 2027
      </Typography>
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoFocus
        autoComplete="current-password"
        fullWidth
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading || !password}
      >
        Enter
      </Button>
    </Box>
  );
}
