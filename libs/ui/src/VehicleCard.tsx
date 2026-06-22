import type { ReactNode } from "react";
import Box from "@mui/material/Box";
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
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        overflow: "hidden",
        transition: "transform 220ms ease, box-shadow 220ms ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 28px 90px rgba(31, 42, 31, 0.14)",
        },
      }}
    >
      <Box
        sx={{
          height: 148,
          background:
            "radial-gradient(circle at 78% 22%, rgba(255,255,255,0.78), transparent 7rem), linear-gradient(135deg, rgba(21,101,192,0.92), rgba(0,137,123,0.72))",
        }}
      />
      <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
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
              <Chip
                label={vehicle.transmission}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${vehicle.seats} seats`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Stack>
          <Typography
            variant="h5"
            component="p"
            color="primary"
            sx={{ whiteSpace: "nowrap" }}
          >
            {vehicle.priceLabel}
          </Typography>
        </Stack>
        {actions}
      </CardContent>
    </Card>
  );
}
