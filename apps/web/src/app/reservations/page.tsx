import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReservationList from "../../components/ReservationList";
import { requireSignedIn } from "../../lib/server-auth";

export default async function ReservationsPage() {
  await requireSignedIn("/reservations");

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={{ maxWidth: 820, mb: 4, animation: "handoff-rise 420ms ease both" }}>
        <Stack spacing={1.5}>
          <Typography variant="h2" component="h1">
            Reservations
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.1rem" }}>
            Manage current and upcoming reservations, review status, and
            continue the next available reservation action.
          </Typography>
        </Stack>
      </Box>
      <ReservationList />
    </Container>
  );
}
