import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
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
    <Box sx={{ overflowX: "hidden" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 7, md: 12 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.12fr 0.88fr" },
            gap: { xs: 5, md: 8 },
            alignItems: "center",
            animation: "handoff-rise 520ms ease both",
          }}
        >
          <Stack spacing={3} sx={{ maxWidth: 900 }}>
            <Typography variant="overline" color="primary.main">
              Car rental operations
            </Typography>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: {
                  xs: "clamp(3rem, 18vw, 4.3rem)",
                  md: "clamp(4.8rem, 7vw, 7.25rem)",
                },
              }}
            >
              Rental handoffs without counter friction.
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ maxWidth: 680, lineHeight: 1.45 }}
            >
              Reserve a vehicle, authorize payment, and continue every
              post-booking step from one customer portal.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button href="/sign-in" variant="contained" size="large">
                Sign in
              </Button>
              <Button href="/sign-up" variant="outlined" size="large">
                Register
              </Button>
            </Stack>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              position: "relative",
              overflow: "hidden",
              minHeight: { xs: 420, md: 560 },
              p: { xs: 2.5, md: 3 },
              borderRadius: 6,
              bgcolor: "rgba(255, 255, 255, 0.72)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 70% 12%, rgba(21,101,192,0.22), transparent 18rem), linear-gradient(145deg, rgba(16,21,16,0.04), rgba(255,255,255,0))",
              },
            }}
          >
            <Stack
              spacing={2}
              sx={{ position: "relative", minHeight: "inherit", justifyContent: "space-between" }}
            >
              <Stack spacing={1}>
                <Typography variant="overline" color="primary.main">
                  Live journey
                </Typography>
                <Typography variant="h4" component="p">
                  Booking to pickup, sequenced.
                </Typography>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gridAutoRows: 88,
                  gap: 1.25,
                }}
              >
                {features.map((feature, index) => (
                  <Paper
                    key={feature}
                    elevation={0}
                    sx={{
                      gridColumn: {
                        xs: "span 6",
                        sm: index === 0 || index === 3 ? "span 6" : "span 3",
                      },
                      p: 2,
                      display: "flex",
                      alignItems: "flex-end",
                      borderRadius: 4,
                      bgcolor: index === 0 ? "primary.main" : "rgba(255,255,255,0.82)",
                      color: index === 0 ? "primary.contrastText" : "text.primary",
                      border: "1px solid",
                      borderColor: index === 0 ? "primary.main" : "divider",
                    }}
                  >
                    <Typography variant="subtitle1">{feature}</Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Container>

      <Container maxWidth="xl" sx={{ pb: { xs: 8, md: 14 } }}>
        <Stack spacing={2} sx={{ maxWidth: 760 }}>
          <Typography variant="h3" component="h2">
            Built for the moments that usually slow rentals down.
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.1rem" }}>
            The portal keeps vehicle choice, reservation status, payment
            authorization, verification, upgrades, receipts, and rental status
            in one authenticated flow.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
