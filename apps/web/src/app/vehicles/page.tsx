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
    vehicles = parsed.success ? await getVehicles(filter) : [];
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
          <form
            action="/vehicles"
            className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/15 p-4"
          >
            {Object.entries(params)
              .filter(([key]) => key !== "pickupAt" && key !== "dropoffAt")
              .flatMap(([key, value]) =>
                (Array.isArray(value) ? value : value ? [value] : []).map(
                  (v, index) => (
                    <input
                      type="hidden"
                      key={`${key}-${index}`}
                      name={key}
                      value={v}
                    />
                  ),
                ),
              )}
            <label className="text-sm text-white/70">
              Pick-up (UTC)
              <input
                type="datetime-local"
                name="pickupAt"
                required
                defaultValue={
                  typeof params.pickupAt === "string" ? params.pickupAt : ""
                }
                className="mt-1 block rounded border border-white/20 bg-black p-2 [color-scheme:dark]"
              />
            </label>
            <label className="text-sm text-white/70">
              Return (UTC)
              <input
                type="datetime-local"
                name="dropoffAt"
                required
                defaultValue={
                  typeof params.dropoffAt === "string" ? params.dropoffAt : ""
                }
                className="mt-1 block rounded border border-white/20 bg-black p-2 [color-scheme:dark]"
              />
            </label>
            <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">
              Find available cars
            </button>
            <p className="w-full text-xs text-white/50">
              Cars become available 24 hours after their scheduled return. All
              demo times are UTC.
            </p>
          </form>
          <VehicleFilters />
        </div>

        {!parsed.success && (
          <p role="alert" className="mt-4 text-red-300">
            Check your filters and choose both times, between 1 hour and 90 days
            apart.
          </p>
        )}

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
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                rentalQuery={
                  filter.pickupAt && filter.dropoffAt
                    ? new URLSearchParams({
                        pickupAt: filter.pickupAt,
                        dropoffAt: filter.dropoffAt,
                      }).toString()
                    : ""
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
