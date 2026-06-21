"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { getBookings } from "../lib/client-api";

export default function RecentBookings() {
  const query = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
  });
  const bookings = query.data ?? [];

  return (
    <Box component="section" sx={{ mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Recent bookings
      </Typography>
      {query.isLoading ? (
        <CircularProgress size={24} />
      ) : query.isError ? (
        <Alert severity="error">Could not load bookings.</Alert>
      ) : bookings.length === 0 ? (
        <Alert severity="info">No bookings yet.</Alert>
      ) : (
        <List disablePadding>
          {bookings.map((booking) => (
            <ListItem key={booking.id} divider disableGutters>
              <ListItemText
                primary={booking.customerName}
                secondary={`${booking.vehicleId} | ${booking.startDate} to ${booking.endDate}`}
              />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip label={booking.status} size="small" />
                <Typography variant="body2" color="text.secondary">
                  {booking.customerEmail}
                </Typography>
              </Stack>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
