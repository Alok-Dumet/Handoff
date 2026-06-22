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

  return (
    <PreCheckInForm
      key={query.data?.reservationId ?? reservationId}
      initialForm={query.data ? workflowToForm(query.data) : emptyForm}
      isCompleted={workflow?.status === "completed"}
      isSubmitting={mutation.isPending}
      reservationId={reservationId}
      showSubmitError={mutation.isError}
      onSubmit={(form) => {
        mutation.mutate({
          reservationId,
          driver: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
          },
          pickup: {
            locationName: form.locationName,
            date: form.date,
            time: form.time,
          },
          trip: {
            ...(form.flightNumber ? { flightNumber: form.flightNumber } : {}),
            ...(form.notes ? { notes: form.notes } : {}),
          },
        });
      }}
    />
  );
}

function PreCheckInForm({
  initialForm,
  isCompleted,
  isSubmitting,
  onSubmit,
  reservationId,
  showSubmitError,
}: {
  initialForm: PreCheckInFormState;
  isCompleted: boolean;
  isSubmitting: boolean;
  onSubmit: (form: PreCheckInFormState) => void;
  reservationId: string;
  showSubmitError: boolean;
}) {
  const [form, setForm] = useState(initialForm);

  function updateField(field: keyof PreCheckInFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

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
            value={form.fullName}
          />
          <TextField
            fullWidth
            label="Email"
            onChange={(event) => updateField("email", event.target.value)}
            required
            type="email"
            value={form.email}
          />
        </Stack>
        <TextField
          fullWidth
          label="Phone"
          onChange={(event) => updateField("phone", event.target.value)}
          required
          value={form.phone}
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
          value={form.locationName}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            label="Pickup date"
            onChange={(event) => updateField("date", event.target.value)}
            required
            type="date"
            value={form.date}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth
            label="Pickup time"
            onChange={(event) => updateField("time", event.target.value)}
            required
            type="time"
            value={form.time}
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
          value={form.flightNumber}
        />
        <TextField
          fullWidth
          label="Notes"
          multiline
          onChange={(event) => updateField("notes", event.target.value)}
          rows={3}
          value={form.notes}
        />
      </Stack>

      {showSubmitError ? (
        <Alert severity="error">
          Pre-check-in could not be submitted. Check the fields and try again.
        </Alert>
      ) : null}

      <Button disabled={isSubmitting} type="submit" variant="contained">
        {isSubmitting ? "Saving..." : "Complete pre-check-in"}
      </Button>
    </Stack>
  );
}

function workflowToForm(
  workflow: PreCheckInWorkflowState,
): PreCheckInFormState {
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
