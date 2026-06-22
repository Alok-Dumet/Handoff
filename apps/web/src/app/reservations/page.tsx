import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ReservationList from "../../components/ReservationList";

export default function ReservationsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reservations
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Manage current and upcoming reservations, review status, and continue
        the next available reservation action.
      </Typography>
      <ReservationList />
    </Container>
  );
}
