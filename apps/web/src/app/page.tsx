import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VehicleCard from "../components/VehicleCard";
import RecentBookings from "../components/RecentBookings";
import { getVehicles } from "../lib/server-api";

export default async function Home() {
  const vehicles = await getVehicles();

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available vehicles
      </Typography>
      <Stack spacing={2}>
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </Stack>
      <RecentBookings />
    </Container>
  );
}
