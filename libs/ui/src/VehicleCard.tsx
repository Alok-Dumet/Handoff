import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { VehicleSummary } from "@handoff/contracts";

export type VehicleCardProps = {
  vehicle: VehicleSummary;
  actions?: ReactNode;
};

export function VehicleCard({ vehicle, actions }: VehicleCardProps) {
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
        {actions}
      </CardContent>
    </Card>
  );
}
