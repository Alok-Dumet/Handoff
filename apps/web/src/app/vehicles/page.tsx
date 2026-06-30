import { VehicleFilterSchema } from "@handoff/contracts";
import VehicleCard from "@/components/VehicleCard";
import VehicleFilters from "@/components/VehicleFilters";
import { getVehicles } from "@/lib/vehicles";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Validate the URL params into a VehicleFilter (never trust the URL). A
  // single `?classes=suv` arrives as a string; normalize to an array first.
  const raw = { ...params };
  if (raw.classes !== undefined && !Array.isArray(raw.classes)) {
    raw.classes = [raw.classes];
  }
  const parsed = VehicleFilterSchema.safeParse(raw);
  const filter = parsed.success ? parsed.data : {};

  let vehicles;
  try {
    vehicles = await getVehicles(filter);
  } catch {
    vehicles = null;
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-16 pt-28">
      <div className="mx-auto w-full max-w-7xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Vehicles
        </h1>
        <p className="mt-2 text-white/60">
          Browse available cars and start your booking.
        </p>

        <div className="mt-8">
          <VehicleFilters />
        </div>

        {vehicles === null ? (
          <p className="mt-10 rounded-xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/50">
            Couldn&apos;t load vehicles right now. Please try again shortly.
          </p>
        ) : vehicles.length === 0 ? (
          <p className="mt-10 rounded-xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/50">
            No vehicles match your filters. Try widening them.
          </p>
        ) : (
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
