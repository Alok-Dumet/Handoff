import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import ReservationPaymentAction from "../../../components/ReservationPaymentAction";
import { BffRequestError } from "../../../lib/bff-errors";
import { getReservation } from "../../../lib/server-api";
import { requireSignedIn } from "../../../lib/server-auth";

type ReservationDetailPageParams = {
  id: string;
};

const statusColor = {
  pending: "warning",
  confirmed: "success",
  cancelled: "default",
} as const;

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<ReservationDetailPageParams>;
}) {
  const { id } = await params;
  await requireSignedIn(`/reservations/${id}`);
  const reservation = await loadReservation(id);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Button href="/reservations" variant="text" sx={{ alignSelf: "flex-start" }}>
          Back to reservations
        </Button>
        <Typography variant="h4" component="h1">
          Reservation {reservation.id}
        </Typography>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Chip
                color={statusColor[reservation.status]}
                label={reservation.status}
              />
              <Chip
                label={`Payment: ${reservation.paymentState.replace("_", " ")}`}
                variant="outlined"
              />
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="h6">{reservation.vehicleLabel}</Typography>
              <Typography color="text.secondary">
                Vehicle ID: {reservation.vehicleId}
              </Typography>
              <Typography color="text.secondary">
                {reservation.startDate} to {reservation.endDate}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={0.5}>
              <Typography variant="subtitle1">Customer</Typography>
              <Typography>{reservation.customer.name}</Typography>
              <Typography color="text.secondary">
                {reservation.customer.email}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle1">Payment</Typography>
              <ReservationPaymentAction reservation={reservation} />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle1">Next journey action</Typography>
              <Typography color="text.secondary">
                {reservation.nextJourney.description ??
                  `Continue with ${reservation.nextJourney.label}.`}
              </Typography>
              <Button
                href={reservation.nextActionHref}
                variant="contained"
                sx={{ alignSelf: "flex-start" }}
              >
                {reservation.nextActionLabel}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

async function loadReservation(id: string) {
  try {
    return await getReservation(id);
  } catch (error) {
    if (error instanceof BffRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
