import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { VehicleSummary } from "@handoff/contracts";

// Presentational card for a single vehicle. Pure props in, no data fetching —
// so it's reusable and easy to document in Storybook.
export default function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Stack spacing={1}>
            <Typography variant="h6" component="h2">
              {vehicle.title}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Chip label={vehicle.class} size="small" />
              <Chip label={vehicle.transmission} size="small" variant="outlined" />
              <Chip label={`${vehicle.seats} seats`} size="small" variant="outlined" />
            </Stack>
          </Stack>
          <Typography variant="h6" component="p" color="primary" noWrap>
            {vehicle.priceLabel}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
