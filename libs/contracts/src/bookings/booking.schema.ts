import { z } from 'zod';
import { LocalDateTimeSchema } from '../rental-window/rental-window.schema.js';

export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

const BookingFieldsSchema = z.object({
  vehicleId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

/**
 * The purchase-page booking: everything a reservation needs beyond the bare
 * dates. Kept separate from BookingFieldsSchema because payments, rentals and
 * journeys already read the date-only shape — this extends the booking rather
 * than redefining what those consumers rely on.
 *
 * Amounts are integer CENTS, recomputed by the server at write time. The
 * client's quote is a display; whatever it claims, the stored total is the
 * one the server derived from these same inputs.
 */
export const BookingExtrasSchema = z.object({
  pickupLocationId: z.string().min(1),
  dropoffLocationId: z.string().min(1),
  pickupAt: LocalDateTimeSchema,
  dropoffAt: LocalDateTimeSchema,
  addOnIds: z.array(z.string().min(1)).default([]),
  protectionPlanId: z.string().min(1),
  /**
   * The terms version the customer accepted. Storing the version rather than
   * a boolean is what makes the acceptance meaningful later — "they agreed"
   * is not defensible without knowing what they agreed to.
   */
  acceptedTermsVersion: z.string().min(1),
});
export type BookingExtras = z.infer<typeof BookingExtrasSchema>;

const validDateRange = {
  message: 'End date must be after start date',
  path: ['endDate'],
};

export const CreateBookingSchema = BookingFieldsSchema.refine(
  (booking) => booking.endDate > booking.startDate,
  validDateRange,
);
export type CreateBooking = z.infer<typeof CreateBookingSchema>;

export const BookingSchema = BookingFieldsSchema.extend({
  id: z.string(),
  status: BookingStatusSchema,
  createdAt: z.iso.datetime(),
}).refine((booking) => booking.endDate > booking.startDate, validDateRange);
export type Booking = z.infer<typeof BookingSchema>;

export const BookingListSchema = z.array(BookingSchema);
export type BookingList = z.infer<typeof BookingListSchema>;

/**
 * What the purchase page submits. The window, extras and accepted terms come
 * from the customer; the price does NOT — the server recomputes it, so a
 * stale tab or a tampered client cannot book yesterday's price.
 */
export const CreateReservationSchema = z.object({
  vehicleId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  extras: BookingExtrasSchema,
});
export type CreateReservation = z.infer<typeof CreateReservationSchema>;

/**
 * The storage shape refdata writes: the customer's inputs plus the totals the
 * BFF computed. Separate from CreateReservation precisely because these price
 * fields must never be accepted from the browser.
 */
export const CreateBookingWithExtrasSchema = BookingFieldsSchema.extend({
  extras: BookingExtrasSchema,
  totalCents: z.number().int().nonnegative(),
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
});
export type CreateBookingWithExtras = z.infer<
  typeof CreateBookingWithExtrasSchema
>;

/** A booking as stored, including the priced extras. */
export const BookingDetailSchema = BookingSchema.safeExtend({
  extras: BookingExtrasSchema,
  totalCents: z.number().int().nonnegative(),
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  totalLabel: z.string(),
});
export type BookingDetail = z.infer<typeof BookingDetailSchema>;
