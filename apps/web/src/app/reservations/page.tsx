import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ReservationList from "../../components/ReservationList";
import { requireSignedIn } from "../../lib/server-auth";

export default async function ReservationsPage() {
  await requireSignedIn("/reservations");

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
