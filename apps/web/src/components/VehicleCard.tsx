import type { VehicleSummary } from "@handoff/contracts";
import { VehicleCard as SharedVehicleCard } from "@handoff/ui";
import ReserveButton from "./ReserveButton";

export default function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <SharedVehicleCard
      vehicle={vehicle}
      actions={<ReserveButton vehicle={vehicle} />}
    />
  );
}
