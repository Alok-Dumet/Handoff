import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import RecentBookings from "../../components/RecentBookings";

export default function ReservationsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reservations
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Manage current and upcoming reservations. Detail pages and payment
        status are next in the reservation-management buildout.
      </Typography>
      <RecentBookings
        heading="Current reservations"
        emptyMessage="No reservations yet."
        errorMessage="Reservations could not be loaded."
      />
    </Container>
  );
}
