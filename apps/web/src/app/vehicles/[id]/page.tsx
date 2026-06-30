import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVehicle } from "@/lib/vehicles";
import { CLASS_IMAGE } from "@/lib/vehicle-images";
import { CLASS_FEATURES } from "@/lib/vehicle-features";

// Static placeholders until real date/time selection + a reservation hold
// exist. Mirrors the layout the user specified.
const PICKUP_WHEN = { day: "Wed, Jul 1, 2026", time: "12:00 PM" };
const DROPOFF_WHEN = { day: "Fri, Jul 3, 2026", time: "12:00 PM" };

const LINE_ITEMS = [
  "Vehicle Total Rate",
  "Protection Plan",
  "Add-Ons",
  "Local Tax",
] as const;

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-16 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/vehicles"
          className="text-sm text-white/50 underline-offset-2 hover:text-white hover:underline"
        >
          ← Back to vehicles
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: vehicle + pick-up / drop-off */}
          <div className="flex flex-col gap-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <Image
                src={CLASS_IMAGE[vehicle.class]}
                alt={vehicle.title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain p-8"
              />
              <span className="absolute left-4 top-4 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-white/80 backdrop-blur">
                {vehicle.class}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {vehicle.title}
              </h1>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <dt>Seats</dt>
                  <dd className="text-white/80">{vehicle.seats}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt>Transmission</dt>
                  <dd className="capitalize text-white/80">
                    {vehicle.transmission}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt>Rate</dt>
                  <dd className="flex items-center gap-2">
                    {vehicle.originalPriceLabel && (
                      <span className="text-white/40 line-through">
                        {vehicle.originalPriceLabel}
                      </span>
                    )}
                    <span
                      className={
                        vehicle.originalPriceLabel
                          ? "font-medium text-emerald-400"
                          : "text-white/80"
                      }
                    >
                      {vehicle.priceLabel}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Pick Up / Drop Off */}
            <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                  Pick Up
                </p>
                <p className="mt-2 font-medium text-white">
                  {vehicle.pickupLocation}
                </p>
                <p className="text-sm text-white/50">{vehicle.pickupAddress}</p>
                <p className="mt-2 text-sm text-white/80">{PICKUP_WHEN.day}</p>
                <p className="text-sm text-white/60">{PICKUP_WHEN.time}</p>
              </div>
              <div className="sm:border-l sm:border-white/10 sm:pl-4">
                <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                  Drop Off
                </p>
                <p className="mt-2 font-medium text-white">
                  {vehicle.pickupLocation}
                </p>
                <p className="text-sm text-white/50">{vehicle.pickupAddress}</p>
                <p className="mt-2 text-sm text-white/80">{DROPOFF_WHEN.day}</p>
                <p className="text-sm text-white/60">{DROPOFF_WHEN.time}</p>
              </div>
            </div>
          </div>

          {/* Right: booking summary (sticky on large screens) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Booking summary
              </h2>

              <dl className="flex flex-col gap-3 text-sm">
                {LINE_ITEMS.map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <dt className="text-white/60">{label}</dt>
                    <dd className="text-white/40">—</dd>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3">
                  <dt className="font-semibold text-white">Total</dt>
                  <dd className="font-semibold text-white/40">—</dd>
                </div>
              </dl>

              <p className="text-center text-sm text-white/50">
                Time left to book:{" "}
                <span className="font-medium text-white/80">20m:54s</span>
              </p>

              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black opacity-50"
              >
                Reserve
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
