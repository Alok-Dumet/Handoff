import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RecentBookings from "../../components/RecentBookings";
import VehicleCard from "../../components/VehicleCard";
import { getVehicles } from "../../lib/server-api";
import { requireSignedIn } from "../../lib/server-auth";

export default async function VehiclesPage() {
  await requireSignedIn("/vehicles");
  const vehicles = await getVehicles();

  return (
    <Box sx={{ overflowX: "hidden" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
        <Paper
          variant="outlined"
          sx={{
            position: "relative",
            overflow: "hidden",
            mb: { xs: 4, md: 6 },
            p: { xs: 3, md: 5 },
            borderRadius: 6,
            bgcolor: "rgba(16,24,33,0.78)",
            animation: "handoff-rise 440ms ease both",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 82% 18%, rgba(143,215,255,0.16), transparent 22rem)",
              pointerEvents: "none",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
              gap: { xs: 3, md: 6 },
              alignItems: "end",
            }}
          >
            <Stack spacing={2.25} sx={{ maxWidth: 860 }}>
              <Typography variant="overline" color="primary.main">
                Customer rental portal
              </Typography>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontSize: {
                    xs: "clamp(2.65rem, 13vw, 3.7rem)",
                    md: "clamp(3.75rem, 5.2vw, 5.7rem)",
                  },
                  maxWidth: 780,
                }}
              >
                Available vehicles
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 620, lineHeight: 1.5 }}
              >
                Choose a vehicle and reserve it for your next trip.
              </Typography>
            </Stack>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                Continue from vehicle search into booking, payment
                authorization, and post-confirmation customer journeys.
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                {["Search", "Reserve", "Continue"].map((step, index) => (
                  <Paper
                    key={step}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor:
                        index === 1
                          ? "primary.main"
                          : "rgba(244,247,243,0.07)",
                      color:
                        index === 1 ? "primary.contrastText" : "text.primary",
                      animation: "handoff-rise 520ms ease both",
                      animationDelay: `${120 + index * 90}ms`,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      {step}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Box>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1fr) minmax(340px, 0.42fr)",
            },
            gap: { xs: 4, lg: 5 },
            alignItems: "start",
          }}
        >
          <Stack spacing={2.5}>
            <Typography variant="h4" component="h2">
              Choose a vehicle
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2.5,
              }}
            >
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </Box>
          </Stack>
          <RecentBookings
            heading="Recent bookings"
            emptyMessage="No bookings yet."
            errorMessage="Could not load bookings."
          />
        </Box>
      </Container>
    </Box>
  );
}
