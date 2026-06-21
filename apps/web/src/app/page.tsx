import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { VehicleSummaryListSchema } from "@handoff/contracts";
import VehicleCard from "../components/VehicleCard";

// Server Component: runs on the server, so it calls the BFF directly.
// No caching yet — always fetch fresh while we build the skeleton.
async function getVehicles() {
  const bffUrl = process.env.BFF_URL ?? "http://localhost:3001";
  const res = await fetch(`${bffUrl}/vehicles`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`BFF responded ${res.status}`);
  }
  // Validate the BFF response against the shared contract before rendering.
  return VehicleSummaryListSchema.parse(await res.json());
}

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
    </Container>
  );
}
