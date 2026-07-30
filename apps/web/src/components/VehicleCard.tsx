import Image from "next/image";
import Link from "next/link";
import type { VehicleSummary } from "@handoff/contracts";
import { CLASS_IMAGE } from "@/lib/vehicle-images";

export default function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  return (
    <div
      className="flex flex-col block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-colors hover:border-white/25 gap-4"
    >
      <div className="relative aspect-[4/3] bg-black/40">
        <Image
          src={CLASS_IMAGE[vehicle.class]}
          alt={vehicle.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-6 pb-0"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-white/80 backdrop-blur">
          {vehicle.class}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-5 pt-0">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {vehicle.title}
          </h2>
          <span className="flex flex-col items-end whitespace-nowrap">
            {vehicle.originalPriceLabel && (
              <span className="text-xs font-medium text-white/40 line-through">
                {vehicle.originalPriceLabel}
              </span>
            )}
            <span
              className={`text-base font-semibold ${
                vehicle.originalPriceLabel ? "text-emerald-400" : "text-white"
              }`}
            >
              {vehicle.priceLabel}
            </span>
          </span>
        </div>

        <dl className="flex flex-col gap-1.5 text-sm text-white/60">
          <div className="flex items-center justify-between">
            <dt>Seats</dt>
            <dd className="text-white/80">{vehicle.seats}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Transmission</dt>
            <dd className="capitalize text-white/80">{vehicle.transmission}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>Pick-up</dt>
            <dd className="text-right text-white/80">
              {vehicle.pickupLocation}
              {vehicle.distanceLabel && (
                <span className="block text-xs text-white/50">
                  {vehicle.distanceLabel}
                </span>
              )}
            </dd>
          </div>
        </dl>
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="block overflow-hidden rounded-xl border border-white/50 bg-red-500/40 transition-colors hover:border-white/100 text-centerRemove"
        >
          Check Out
        </Link>
      </div>
    </div>
  );
}
