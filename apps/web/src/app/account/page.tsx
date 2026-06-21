import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function AccountPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Account
        </Typography>
        <Alert severity="info">
          Clerk authentication is the next implementation step. This page is
          ready to become the authenticated account center.
        </Alert>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="h6">Customer profile</Typography>
            <Typography color="text.secondary">
              Signed-in customer identity, loyalty details, saved contact
              preferences, and payment profile will live here.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained">Sign in with Clerk</Button>
              <Button href="/reservations" variant="outlined">
                View reservations
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
