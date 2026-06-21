"use client";

import type { FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { VehicleSummary } from "@handoff/contracts";
import JourneyPrompt from "./JourneyPrompt";
import { useCreateBooking } from "../hooks/useCreateBooking";
import { BookingRequestError } from "../lib/client-api";

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export default function ReserveButton({
  vehicle,
}: {
  vehicle: VehicleSummary;
}) {
  const mutation = useCreateBooking();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    mutation.mutate({
      vehicleId: vehicle.id,
      customerName: String(formData.get("customerName") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={1.5} sx={{ mt: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          name="customerName"
          label="Name"
          size="small"
          required
          fullWidth
        />
        <TextField
          name="customerEmail"
          label="Email"
          type="email"
          size="small"
          required
          fullWidth
        />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          name="startDate"
          label="Start"
          type="date"
          defaultValue={today}
          size="small"
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          name="endDate"
          label="End"
          type="date"
          defaultValue={tomorrow}
          size="small"
          required
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={mutation.isPending}
          sx={{ minWidth: 112 }}
        >
          {mutation.isPending ? "Reserving" : "Reserve"}
        </Button>
      </Stack>
      {mutation.data ? (
        <Stack spacing={1.5}>
          <Alert severity="success">
            Reserved. Booking {mutation.data.booking.id}
          </Alert>
          <JourneyPrompt
            bookingId={mutation.data.booking.id}
            journey={mutation.data.nextJourney}
          />
        </Stack>
      ) : null}
      {mutation.isError ? (
        <Alert severity="error">
          {mutation.error instanceof BookingRequestError &&
          mutation.error.status === 409
            ? "Vehicle unavailable for those dates."
            : "Reservation failed. Check the form and try again."}
        </Alert>
      ) : null}
    </Stack>
  );
}
