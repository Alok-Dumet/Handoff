"use client";

import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReservationDetail } from "@handoff/contracts";
import { useCreateReservationPaymentSession } from "../hooks/useCreateReservationPaymentSession";

export default function ReservationPaymentAction({
  reservation,
}: {
  reservation: ReservationDetail;
}) {
  const router = useRouter();
  const mutation = useCreateReservationPaymentSession(reservation.id);
  const authorizationStarted = Boolean(mutation.data);

  function handleAuthorize() {
    mutation.mutate({
      reservationId: reservation.id,
      mode: "authorize",
    }, {
      onSuccess: () => {
        router.refresh();
      },
    });
  }

  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { xs: "stretch", sm: "center" } }}
      >
        <Button
          disabled={
            mutation.isPending ||
            authorizationStarted ||
            reservation.paymentState !== "not_started"
          }
          onClick={handleAuthorize}
          variant="contained"
        >
          {mutation.isPending
            ? "Authorizing..."
            : authorizationStarted
              ? "Payment authorized"
              : "Authorize payment"}
        </Button>
        <Typography color="text.secondary" variant="body2">
          Payment is calculated on the server from the reservation dates and
          vehicle price.
        </Typography>
      </Stack>

      {mutation.data ? (
        <Alert severity="success">
          Local Stripe session {mutation.data.providerSessionId} created for{" "}
          {formatCurrency(mutation.data.amountCents)}. Status:{" "}
          {mutation.data.status.replaceAll("_", " ")}.
        </Alert>
      ) : null}

      {mutation.data ? (
        <Typography color="text.secondary" variant="body2">
          Client secret: {mutation.data.clientSecret}
        </Typography>
      ) : null}

      {mutation.isError ? (
        <Alert severity="error">
          Payment session could not be started. Try again from the reservation
          details.
        </Alert>
      ) : null}
    </Stack>
  );
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}
