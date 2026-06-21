import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function RentalPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Rental status
        </Typography>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="h6">No active rental selected</Typography>
            <Typography color="text.secondary">
              Current rental state, pickup details, return instructions, and
              support actions will be backed by the rental service here.
            </Typography>
            <Button href="/reservations" variant="contained">
              Find a reservation
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
