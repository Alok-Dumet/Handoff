import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCatalog,
  getLocations,
  getQuote,
  getTerms,
  getVehicle,
} from "@/lib/vehicles";
import { CLASS_IMAGE } from "@/lib/vehicle-images";
import { CLASS_FEATURES } from "@/lib/vehicle-features";
import RentalWindowPicker from "@/components/RentalWindowPicker";
import PurchaseExtras from "@/components/PurchaseExtras";

// Shown before a rental window is chosen, so the summary keeps its shape
// instead of collapsing to nothing.
const PLACEHOLDER_LINES = [
  "Vehicle Total Rate",
  "Protection Plan",
  "Add-Ons",
  "Local Tax",
] as const;

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [vehicle, locations, catalog, terms] = await Promise.all([
    getVehicle(id),
    getLocations(),
    getCatalog(),
    getTerms(),
  ]);

  if (!vehicle) {
    notFound();
  }

  // Price only once both ends of the window are present. The BFF re-validates
  // and returns null for an illegal window, so a half-filled form or a
  // hand-edited URL shows an un-priced summary rather than an error.
  const pickupAt = typeof query.pickupAt === "string" ? query.pickupAt : "";
  const dropoffAt = typeof query.dropoffAt === "string" ? query.dropoffAt : "";
  const addOnIds =
    typeof query.addOnIds === "string"
      ? [query.addOnIds]
      : (query.addOnIds ?? []);
  const protectionPlanId =
    typeof query.protectionPlanId === "string"
      ? query.protectionPlanId
      : undefined;

  const quote =
    pickupAt && dropoffAt
      ? await getQuote({
          vehicleId: vehicle.id,
          pickupAt,
          dropoffAt,
          addOnIds,
          protectionPlanId,
        })
      : null;

  // Match the current version so changed terms invalidate stale acceptance.
  const termsAccepted = query.termsAccepted === terms.version;

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

            {/* Pick Up / Drop Off — real selection, drives duration + pricing */}
            <RentalWindowPicker
              locations={locations}
              defaultPickupLocationId={vehicle.pickupLocationId}
            />

            <PurchaseExtras catalog={catalog} terms={terms} />

            {/* Features — display only, not filterable on /vehicles */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
                Features
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                {CLASS_FEATURES[vehicle.class].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span aria-hidden className="mt-0.5 text-white/30">
                      •
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: booking summary (sticky on large screens) */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Booking summary
              </h2>

              <dl className="flex flex-col gap-3 text-sm">
                {quote
                  ? quote.lines.map((line) => (
                      <div
                        key={line.key}
                        className="flex items-start justify-between gap-4"
                      >
                        <dt className="text-white/60">
                          {line.label}
                          {line.detail && (
                            <span className="block text-xs text-white/35">
                              {line.detail}
                            </span>
                          )}
                        </dt>
                        <dd className="whitespace-nowrap text-white/80">
                          {line.amountLabel}
                        </dd>
                      </div>
                    ))
                  : PLACEHOLDER_LINES.map((label) => (
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
                  <dd
                    className={
                      quote
                        ? "font-semibold text-white"
                        : "font-semibold text-white/40"
                    }
                  >
                    {quote ? quote.totalLabel : "—"}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled
                aria-describedby="reservation-status"
                className="w-full cursor-not-allowed rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black opacity-50"
              >
                Reserve
              </button>

              <p id="reservation-status" className="text-center text-xs text-white/40">
                Online reservations are not available yet. Your selections have not been booked.
              </p>
              {(!quote || !termsAccepted) && (
                <p className="text-center text-xs text-white/40">
                  {!quote
                    ? "Choose your pick-up and drop-off times to preview your total."
                    : "Please review and accept the rental terms before purchasing."}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
