import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const features = [
  "Browse vehicles by brand and class",
  "Reserve, authorize payment, and track the booking",
  "Complete pre-check-in, identity verification, e-receipts, and upgrade flows",
  "Review reservations, rental status, and account details in one place",
];

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Stack spacing={4}>
        <Stack spacing={2} sx={{ maxWidth: 760 }}>
          <Typography variant="overline" color="primary.main">
            Car rental operations
          </Typography>
          <Typography variant="h2" component="h1">
            HandOff is a working rental portal for booking and post-booking flows.
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Sign in to reserve a vehicle, pay or authorize payment, and manage
            the customer journey from booking through rental status.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button href="/sign-in" variant="contained" size="large">
              Sign in
            </Button>
            <Button href="/sign-up" variant="outlined" size="large">
              Register
            </Button>
            <Button href="/vehicles" variant="text" size="large">
              View vehicles
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1.5}>
          <Typography variant="h5" component="h2">
            What the app covers
          </Typography>
          <Stack spacing={1}>
            {features.map((feature) => (
              <Typography key={feature} color="text.secondary">
                {feature}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
