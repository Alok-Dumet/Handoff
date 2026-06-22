import type { VehicleSummary } from "@handoff/contracts";
import Box from "@mui/material/Box";
import { VehicleCard as SharedVehicleCard } from "@handoff/ui";
import ReserveButton from "./ReserveButton";

export default function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <Box sx={{ opacity: 0, animation: "handoff-panel-in 520ms ease forwards" }}>
      <SharedVehicleCard
        vehicle={vehicle}
        actions={<ReserveButton vehicle={vehicle} />}
      />
    </Box>
  );
}
