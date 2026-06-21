import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VehicleCard from "../components/VehicleCard";
import RecentBookings from "../components/RecentBookings";
import { getBrandConfig } from "../brands";
import { getVehicles } from "../lib/server-api";

export default async function Home() {
  const brand = getBrandConfig(process.env.BRAND);
  const vehicles = await getVehicles();

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="overline" color="primary.main">
        {brand.copy.appEyebrow}
      </Typography>
      <Typography variant="h4" component="h1" gutterBottom>
        {brand.copy.vehicleListHeading}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {brand.copy.vehicleListIntro}
      </Typography>
      <Stack spacing={2}>
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </Stack>
      <RecentBookings
        heading={brand.copy.recentBookingsHeading}
        emptyMessage={brand.copy.recentBookingsEmpty}
        errorMessage={brand.copy.recentBookingsError}
      />
    </Container>
  );
}
