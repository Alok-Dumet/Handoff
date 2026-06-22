"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useReservations } from "../hooks/useReservations";

const statusColor = {
  pending: "warning",
  confirmed: "success",
  cancelled: "default",
} as const;

export default function ReservationList() {
  const query = useReservations();
  const reservations = query.data ?? [];

  if (query.isLoading) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} variant="rounded" height={112} />
        ))}
      </Stack>
    );
  }

  if (query.isError) {
    return (
      <Alert severity="error">
        Reservations could not be loaded.
      </Alert>
    );
  }

  if (reservations.length === 0) {
    return (
      <Alert severity="info">
        No reservations yet. Choose a vehicle to create your first reservation.
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      {reservations.map((reservation) => (
        <Paper
          key={reservation.id}
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 4,
            bgcolor: "rgba(16,24,33,0.78)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip
                  color={statusColor[reservation.status]}
                  label={reservation.status}
                  size="small"
                />
                <Chip
                  label={`Payment: ${reservation.paymentState.replace("_", " ")}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Typography variant="h6" component="h2">
                {reservation.customerName}
              </Typography>
              <Typography color="text.secondary">
                {reservation.vehicleId} | {reservation.startDate} to{" "}
                {reservation.endDate} | {reservation.customerEmail}
              </Typography>
            </Stack>
            <Button
              href={reservation.detailHref}
              size="small"
              variant="outlined"
              sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
            >
              {reservation.nextActionLabel}
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
