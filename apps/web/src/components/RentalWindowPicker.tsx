"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRentalSelection } from "./RentalSelection";
import type { Location } from "@handoff/contracts";
import {
  MAX_RENTAL_DAYS,
  MIN_RENTAL_HOURS,
  RentalWindowSchema,
  rentalDays,
  rentalHours,
} from "@handoff/contracts";

/**
 * Pick-up / drop-off location + date + time selection.
 *
 * The selected window lives in the URL, not in component state. That is
 * deliberate: the server needs it to price the rental (a client-computed total
 * can never be trusted), and it makes a chosen window shareable and
 * back-button-safe. This component is the only writer.
 */
export default function RentalWindowPicker({
  locations,
  defaultPickupLocationId,
}: {
  locations: Location[];
  /** The vehicle's own branch — the sensible default for both ends. */
  defaultPickupLocationId: string;
}) {
  const router = useRouter();
  const { updating: pending, update: startTransition } = useRentalSelection();
  const searchParams = useSearchParams();

  const pickupLocationId = defaultPickupLocationId;
  const dropoffLocationId = defaultPickupLocationId;
  const pickupAt = searchParams.get("pickupAt") ?? "";
  const dropoffAt = searchParams.get("dropoffAt") ?? "";

  const update = (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    startTransition(() =>
      router.replace(`?${params.toString()}`, { scroll: false }),
    );
  };

  // Validate through the same contract the server uses, so the message the
  // user sees is the message the server would produce.
  const parsed = RentalWindowSchema.safeParse({
    pickupLocationId,
    pickupAt,
    dropoffLocationId,
    dropoffAt,
  });

  const bothDatesChosen = pickupAt !== "" && dropoffAt !== "";
  const days = parsed.success ? rentalDays(pickupAt, dropoffAt) : null;
  const hours = parsed.success ? rentalHours(pickupAt, dropoffAt) : null;

  // Only surface an error once the user has actually filled both dates —
  // "drop-off must be after pick-up" on an empty form is just noise.
  const error =
    bothDatesChosen && !parsed.success
      ? (parsed.error.issues.find((i) => i.path.includes("dropoffAt"))
          ?.message ?? parsed.error.issues[0]?.message)
      : null;

  const fieldSx =
    "w-full rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-white/50 focus:outline-none";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-white/60">
        All times are UTC. Pick up and return at this car&apos;s branch.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Pick Up */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">
            Pick Up
          </p>
          <label className="sr-only" htmlFor="pickup-location">
            Pick-up location
          </label>
          <select
            id="pickup-location"
            value={pickupLocationId}
            disabled
            onChange={(e) => update({ pickupLocationId: e.target.value })}
            className={fieldSx}
          >
            {locations
              .filter((loc) => loc.id === defaultPickupLocationId)
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
          </select>
          <label className="sr-only" htmlFor="pickup-at">
            Pick-up date and time
          </label>
          <input
            id="pickup-at"
            disabled={pending}
            type="datetime-local"
            value={pickupAt}
            onChange={(e) => update({ pickupAt: e.target.value })}
            className={`${fieldSx} [color-scheme:dark]`}
          />
        </div>

        {/* Drop Off */}
        <div className="flex flex-col gap-2 sm:border-l sm:border-white/10 sm:pl-5">
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">
            Drop Off
          </p>
          <label className="sr-only" htmlFor="dropoff-location">
            Drop-off location
          </label>
          <select
            id="dropoff-location"
            value={dropoffLocationId}
            disabled
            onChange={(e) => update({ dropoffLocationId: e.target.value })}
            className={fieldSx}
          >
            {locations
              .filter((loc) => loc.id === defaultPickupLocationId)
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
          </select>
          <label className="sr-only" htmlFor="dropoff-at">
            Drop-off date and time
          </label>
          <input
            id="dropoff-at"
            disabled={pending}
            type="datetime-local"
            // Can't end before it starts — the contract enforces this too, but
            // the native picker should not offer invalid dates in the first place.
            min={pickupAt || undefined}
            value={dropoffAt}
            onChange={(e) => update({ dropoffAt: e.target.value })}
            className={`${fieldSx} [color-scheme:dark]`}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {!bothDatesChosen && !error && (
        <p className="text-sm text-white/40">
          Choose pick-up and drop-off times to see your total.
        </p>
      )}

      {days !== null && hours !== null && (
        <p className="text-sm text-white/60">
          Rental duration{" "}
          <span className="font-medium text-white/90">
            {days} {days === 1 ? "day" : "days"}
          </span>
          {/* Billing rounds partial days up, so say so rather than let the
              customer discover it on the invoice. */}
          {hours % 24 !== 0 && (
            <span className="text-white/40">
              {" "}
              ({hours} hours, billed as {days})
            </span>
          )}
        </p>
      )}

      {dropoffLocationId !== pickupLocationId && (
        <p className="text-xs text-white/40">
          One-way rental — returning to a different branch.
        </p>
      )}

      <p className="sr-only">
        Rentals must be at least {MIN_RENTAL_HOURS} hour and at most{" "}
        {MAX_RENTAL_DAYS} days.
      </p>
    </div>
  );
}
