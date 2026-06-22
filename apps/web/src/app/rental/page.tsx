import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BffRequestError } from "../../lib/bff-errors";
import { getCurrentRental } from "../../lib/server-api";
import { requireSignedIn } from "../../lib/server-auth";

type RentalPageParams = {
  reservationId?: string;
};

const statusColor = {
  "not-started": "default",
  active: "success",
  completed: "info",
} as const;

const reservationColor = {
  pending: "warning",
  confirmed: "success",
  cancelled: "default",
} as const;

const paymentLabel = {
  not_started: "not started",
  authorized: "authorized",
  paid: "paid",
  refunded: "refunded",
  failed: "failed",
} as const;

export default async function RentalPage({
  searchParams,
}: {
  searchParams: Promise<RentalPageParams>;
}) {
  const { reservationId } = await searchParams;
  await requireSignedIn("/rental");
  const rental = await loadRental(reservationId);

  if ("error" in rental) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1">
            Rental status
          </Typography>
          <Alert severity="error">
            Rental status could not be loaded. Try opening a reservation first.
          </Alert>
          <Button href="/reservations" variant="contained" sx={{ alignSelf: "flex-start" }}>
            Find a reservation
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Rental status
        </Typography>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <Chip label={rental.status.replaceAll("-", " ")} color={statusColor[rental.status]} />
              <Chip
                label={rental.reservationStatus}
                color={reservationColor[rental.reservationStatus]}
                variant="outlined"
              />
              <Chip
                label={`Payment: ${paymentLabel[rental.paymentState]}`}
                variant="outlined"
              />
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="h6">{rental.vehicleLabel}</Typography>
              <Typography color="text.secondary">
                Reservation {rental.reservationId} · Vehicle {rental.vehicleId}
              </Typography>
              <Typography color="text.secondary">
                {rental.startDate} to {rental.endDate}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={0.5}>
              <Typography variant="subtitle1">Customer</Typography>
              <Typography>{rental.customerName}</Typography>
              <Typography color="text.secondary">{rental.customerEmail}</Typography>
            </Stack>

            <Divider />

            <Stack spacing={0.5}>
              <Typography variant="subtitle1">Pickup and return</Typography>
              <Typography color="text.secondary">
                Pickup: {rental.pickupLocation}
              </Typography>
              <Typography color="text.secondary">
                Return: {rental.returnLocation}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle1">Support actions</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {rental.supportActions.map((action) => (
                  <Button
                    key={action.href}
                    href={action.href}
                    variant={action.variant}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
              {reservationId ? (
                <Typography color="text.secondary" variant="body2">
                  Showing rental for reservation {reservationId}.
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

async function loadRental(reservationId?: string): Promise<
  | Awaited<ReturnType<typeof getCurrentRental>>
  | { error: true }
> {
  try {
    return await getCurrentRental(reservationId);
  } catch (error) {
    if (error instanceof BffRequestError) {
      return { error: true };
    }

    throw error;
  }
}
