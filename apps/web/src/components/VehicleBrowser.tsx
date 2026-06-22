import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { BrandConfig } from "../brands";
import { getAemPageContent, getVehicles } from "../lib/server-api";
import BrandSwitcher from "./BrandSwitcher";
import RecentBookings from "./RecentBookings";
import VehicleCard from "./VehicleCard";

export default async function VehicleBrowser({ brand }: { brand: BrandConfig }) {
  const [pageContent, vehicles] = await Promise.all([
    getAemPageContent(brand),
    getVehicles(),
  ]);

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
            bgcolor: "rgba(255,255,255,0.76)",
            animation: "handoff-rise 440ms ease both",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 82% 18%, rgba(21,101,192,0.18), transparent 22rem)",
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
                {pageContent.eyebrow}
              </Typography>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontSize: {
                    xs: "clamp(2.8rem, 15vw, 4rem)",
                    md: "clamp(4.2rem, 6vw, 6.5rem)",
                  },
                }}
              >
                {pageContent.heading}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 620, lineHeight: 1.5 }}
              >
                {pageContent.intro}
              </Typography>
            </Stack>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                Switch brand context without leaving the authenticated rental
                workflow.
              </Typography>
              <BrandSwitcher
                activeBrand={brand}
                navigation={pageContent.navigation}
              />
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
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </Box>
          </Stack>
          <RecentBookings
            heading={pageContent.recentBookingsHeading}
            emptyMessage={pageContent.recentBookingsEmpty}
            errorMessage={pageContent.recentBookingsError}
          />
        </Box>
      </Container>
    </Box>
  );
}
