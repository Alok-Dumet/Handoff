import Container from "@mui/material/Container";
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
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="overline" color="primary.main">
        {pageContent.eyebrow}
      </Typography>
      <Typography variant="h4" component="h1" gutterBottom>
        {pageContent.heading}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {pageContent.intro}
      </Typography>
      <BrandSwitcher activeBrand={brand} navigation={pageContent.navigation} />
      <Stack spacing={2}>
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </Stack>
      <RecentBookings
        heading={pageContent.recentBookingsHeading}
        emptyMessage={pageContent.recentBookingsEmpty}
        errorMessage={pageContent.recentBookingsError}
      />
    </Container>
  );
}
