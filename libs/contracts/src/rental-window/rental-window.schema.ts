import { z } from "zod";

/**
 * A rental window: where and when the customer picks the vehicle up, and where
 * and when they bring it back.
 *
 * The demo uses UTC for every branch, shown explicitly in the UI. Inputs use
 * `YYYY-MM-DDTHH:MM` (the datetime-local control's format) and are interpreted
 * as UTC, never as the browser or server's system timezone.
 */
export const LocalDateTimeSchema = z.iso
  .datetime({ local: true })
  // Exactly `YYYY-MM-DDTHH:MM` — no seconds, and no `Z`/offset suffix. An
  // offset would claim a timezone this field deliberately does not have, and
  // z.iso.datetime({ local: true }) alone still admits those forms.
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    "Expected a local date and time (YYYY-MM-DDTHH:MM)",
  );
export type LocalDateTime = z.infer<typeof LocalDateTimeSchema>;

/** Duration bounds, shared so the UI and the server enforce the same rules. */
export const MIN_RENTAL_HOURS = 1;
export const MAX_RENTAL_DAYS = 90;

const RentalWindowFieldsSchema = z.object({
  pickupLocationId: z.string().min(1),
  pickupAt: LocalDateTimeSchema,
  dropoffLocationId: z.string().min(1),
  dropoffAt: LocalDateTimeSchema,
});

/**
 * Parse a local datetime string to epoch ms, reading the wall clock as if it
 * were UTC. Done by hand rather than `new Date(value)` so the number is
 * identical on the server and in the browser whatever their timezones are —
 * the demo intentionally uses that UTC interpretation for storage as well.
 */
export function localDateTimeToMs(value: string): number {
  // Total by design, returning NaN rather than throwing: Zod runs
  // object-level refinements even when a field's format check has already
  // failed, so this is called with whatever the user put in the URL.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return Number.NaN;
  }
  const [, year, month, day, hour, minute] = match.map(Number);
  return Date.UTC(year, month - 1, day, hour, minute);
}

/**
 * Hours between pick-up and drop-off. Negative when the two are reversed, and
 * NaN when either value is not a parseable local datetime.
 */
export function rentalHours(pickupAt: string, dropoffAt: string): number {
  return (
    (localDateTimeToMs(dropoffAt) - localDateTimeToMs(pickupAt)) / 3_600_000
  );
}

/**
 * Billable days. Rental convention: a day is 24 hours and any partial day
 * rounds UP — 48h is 2 days, 50h is 3 — with a floor of 1. This is the number
 * that multiplies the daily rate, so it is the single definition both the
 * price display and the server-side total must use.
 */
export function rentalDays(pickupAt: string, dropoffAt: string): number {
  const hours = rentalHours(pickupAt, dropoffAt);
  // NaN in, NaN out — never silently bill an unparseable window as 1 day.
  return Number.isNaN(hours) ? Number.NaN : Math.max(1, Math.ceil(hours / 24));
}

/**
 * A complete, valid rental window. The refinements are the reason this is a
 * contract rather than four loose fields: drop-off must genuinely follow
 * pick-up, and a rental cannot run unbounded.
 */
export const RentalWindowSchema = RentalWindowFieldsSchema.refine(
  (w) => rentalHours(w.pickupAt, w.dropoffAt) >= MIN_RENTAL_HOURS,
  {
    message: `Drop-off must be at least ${MIN_RENTAL_HOURS} hour after pick-up`,
    path: ["dropoffAt"],
  },
).refine((w) => rentalDays(w.pickupAt, w.dropoffAt) <= MAX_RENTAL_DAYS, {
  message: `A rental cannot exceed ${MAX_RENTAL_DAYS} days`,
  path: ["dropoffAt"],
});
export type RentalWindow = z.infer<typeof RentalWindowSchema>;

/**
 * The window as it arrives from URL query params, where any field may be
 * missing or malformed because the user can type whatever they like into the
 * address bar. Parse with this first, then narrow with RentalWindowSchema.
 */
export const RentalWindowQuerySchema = RentalWindowFieldsSchema.partial();
export type RentalWindowQuery = z.infer<typeof RentalWindowQuerySchema>;
