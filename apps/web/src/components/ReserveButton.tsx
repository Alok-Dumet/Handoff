"use client";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import type { VehicleSummary } from "@handoff/contracts";
import { BookingForm, type BookingFormValues } from "@handoff/ui";
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

  function handleSubmit(values: BookingFormValues) {
    mutation.mutate({
      vehicleId: vehicle.id,
      ...values,
    });
  }

  return (
    <Stack spacing={1.5}>
      <BookingForm
        defaultStartDate={today}
        defaultEndDate={tomorrow}
        isSubmitting={mutation.isPending}
        onSubmit={handleSubmit}
      />
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
