import type { Vehicle } from "@handoff/contracts";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";

const BFF_URL = process.env.BFF_URL ?? "http://localhost:3002";

async function getVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${BFF_URL}/vehicles`, { cache: "no-store" });
  if (!res.ok) throw new Error(`BFF responded ${res.status}`);
  return res.json();
}

function formatPrice(cents: number, currency: string): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency,
  });
}

export default async function Home() {
  const vehicles = await getVehicles();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available vehicles
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        {vehicles.map((v) => (
          <Card key={v.id} variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Typography variant="h6" component="h2">
                  {v.year} {v.make} {v.model}
                </Typography>
                <Chip
                  size="small"
                  label={v.available ? "Available" : "Unavailable"}
                  color={v.available ? "success" : "default"}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 1, my: 1, flexWrap: "wrap" }}>
                <Chip size="small" variant="outlined" label={v.category} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${v.seats} seats`}
                />
                <Chip size="small" variant="outlined" label={v.location} />
              </Box>

              <Typography variant="body1" color="text.secondary">
                {formatPrice(v.pricePerDay, v.currency)} / day
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
