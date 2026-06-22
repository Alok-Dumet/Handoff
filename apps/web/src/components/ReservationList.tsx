"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
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
    return <CircularProgress size={24} />;
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
    <List disablePadding>
      {reservations.map((reservation) => (
        <ListItem
          key={reservation.id}
          divider
          disableGutters
          secondaryAction={
            <Button href={reservation.detailHref} size="small" variant="outlined">
              {reservation.nextActionLabel}
            </Button>
          }
          sx={{ pr: { xs: 12, sm: 16 } }}
        >
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {reservation.customerName}
                </Typography>
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
            }
            secondary={`${reservation.vehicleId} | ${reservation.startDate} to ${reservation.endDate} | ${reservation.customerEmail}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
