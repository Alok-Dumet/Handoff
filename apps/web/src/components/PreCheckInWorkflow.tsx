"use client";

import { useState, type FormEvent } from "react";
import type { PreCheckInWorkflow as PreCheckInWorkflowState } from "@handoff/contracts";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPreCheckInWorkflow,
  submitPreCheckInWorkflow,
} from "../lib/client-api";
import { journeyQueryKeys } from "../hooks/query-keys";

type PreCheckInFormState = {
  fullName: string;
  email: string;
  phone: string;
  locationName: string;
  date: string;
  time: string;
  flightNumber: string;
  notes: string;
};

const emptyForm: PreCheckInFormState = {
  fullName: "",
  email: "",
  phone: "",
  locationName: "",
  date: "",
  time: "",
  flightNumber: "",
  notes: "",
};

export default function PreCheckInWorkflow({
  reservationId,
}: {
  reservationId: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const query = useQuery({
    queryKey: journeyQueryKeys.preCheckIn(reservationId),
    queryFn: () => getPreCheckInWorkflow(reservationId),
  });
  const mutation = useMutation({
    mutationFn: submitPreCheckInWorkflow,
    onSuccess: async (workflow) => {
      queryClient.setQueryData(
        journeyQueryKeys.preCheckIn(reservationId),
        workflow,
      );
    },
  });

  function updateField(field: keyof PreCheckInFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentForm = getDisplayForm(form, query.data);

    mutation.mutate({
      reservationId,
      driver: {
        fullName: currentForm.fullName,
        email: currentForm.email,
        phone: currentForm.phone,
      },
      pickup: {
        locationName: currentForm.locationName,
        date: currentForm.date,
        time: currentForm.time,
      },
      trip: {
        ...(currentForm.flightNumber
          ? { flightNumber: currentForm.flightNumber }
          : {}),
        ...(currentForm.notes ? { notes: currentForm.notes } : {}),
      },
    });
  }

  if (query.isLoading) {
    return <CircularProgress size={24} />;
  }

  if (query.isError) {
    return (
      <Alert severity="error">
        Pre-check-in could not be loaded for this reservation.
      </Alert>
    );
  }

  const workflow = mutation.data ?? query.data;
  const isCompleted = workflow?.status === "completed";
  const displayForm = getDisplayForm(form, query.data);

  return (
    <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
      {isCompleted ? (
        <Alert severity="success">
          Pre-check-in completed for reservation {reservationId}.
        </Alert>
      ) : null}

      <Stack spacing={1}>
        <Typography variant="h6">Driver</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            label="Full name"
            onChange={(event) => updateField("fullName", event.target.value)}
            required
            value={displayForm.fullName}
          />
          <TextField
            fullWidth
            label="Email"
            onChange={(event) => updateField("email", event.target.value)}
            required
            type="email"
            value={displayForm.email}
          />
        </Stack>
        <TextField
          fullWidth
          label="Phone"
          onChange={(event) => updateField("phone", event.target.value)}
          required
          value={displayForm.phone}
        />
      </Stack>

      <Divider />

      <Stack spacing={1}>
        <Typography variant="h6">Pickup</Typography>
        <TextField
          fullWidth
          label="Pickup location"
          onChange={(event) => updateField("locationName", event.target.value)}
          required
          value={displayForm.locationName}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            label="Pickup date"
            onChange={(event) => updateField("date", event.target.value)}
            required
            type="date"
            value={displayForm.date}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth
            label="Pickup time"
            onChange={(event) => updateField("time", event.target.value)}
            required
            type="time"
            value={displayForm.time}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={1}>
        <Typography variant="h6">Trip</Typography>
        <TextField
          fullWidth
          label="Flight number"
          onChange={(event) => updateField("flightNumber", event.target.value)}
          value={displayForm.flightNumber}
        />
        <TextField
          fullWidth
          label="Notes"
          multiline
          onChange={(event) => updateField("notes", event.target.value)}
          rows={3}
          value={displayForm.notes}
        />
      </Stack>

      {mutation.isError ? (
        <Alert severity="error">
          Pre-check-in could not be submitted. Check the fields and try again.
        </Alert>
      ) : null}

      <Button disabled={mutation.isPending} type="submit" variant="contained">
        {mutation.isPending ? "Saving..." : "Complete pre-check-in"}
      </Button>
    </Stack>
  );
}

function getDisplayForm(
  form: PreCheckInFormState,
  workflow: PreCheckInWorkflowState | undefined,
): PreCheckInFormState {
  if (form.fullName || !workflow) {
    return form;
  }

  return {
    fullName: workflow.driver.fullName,
    email: workflow.driver.email,
    phone: workflow.driver.phone,
    locationName: workflow.pickup.locationName,
    date: workflow.pickup.date,
    time: workflow.pickup.time,
    flightNumber: workflow.trip.flightNumber ?? "",
    notes: workflow.trip.notes ?? "",
  };
}
