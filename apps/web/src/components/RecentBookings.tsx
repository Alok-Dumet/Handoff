"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRecentBookings } from "../hooks/useRecentBookings";

export default function RecentBookings({
  heading,
  emptyMessage,
  errorMessage,
}: {
  heading: string;
  emptyMessage: string;
  errorMessage: string;
}) {
  const query = useRecentBookings();
  const bookings = query.data ?? [];

  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 5,
        bgcolor: "rgba(255,255,255,0.78)",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" component="h2">
            {heading}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent activity across the active brand context.
          </Typography>
        </Box>
      {query.isLoading ? (
        <Stack spacing={1.25}>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} variant="rounded" height={72} />
          ))}
        </Stack>
      ) : query.isError ? (
        <Alert severity="error">{errorMessage}</Alert>
      ) : bookings.length === 0 ? (
        <Alert severity="info">{emptyMessage}</Alert>
      ) : (
        <Stack spacing={1.25}>
          {bookings.map((booking) => (
            <Paper
              key={booking.id}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.7)" }}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {booking.customerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {booking.customerEmail}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip label={booking.status} size="small" />
                <Typography variant="body2" color="text.secondary">
                  {booking.vehicleId} | {booking.startDate} to {booking.endDate}
                </Typography>
              </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      </Stack>
    </Paper>
  );
}
