import { z } from "zod";
import { RentalWindowSchema } from "../rental-window/rental-window.schema.js";
import { QuoteSchema } from "../pricing/pricing.schema.js";

export const BookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const BookingExtrasSchema = RentalWindowSchema.safeExtend({
  addOnIds: z.array(z.string().min(1)).max(20).default([]),
  protectionPlanId: z.string().min(1),
  acceptedTermsVersion: z.string().min(1),
});
export type BookingExtras = z.infer<typeof BookingExtrasSchema>;

// Date-only fields remain readable for legacy records. Precise checkout times
// are in extras, including valid rentals that start and finish the same day.
export const BookingSchema = z
  .object({
    id: z.string(),
    vehicleId: z.string(),
    customerName: z.string(),
    customerEmail: z.email(),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    status: BookingStatusSchema,
    createdAt: z.iso.datetime(),
  })
  .refine((b) => b.endDate >= b.startDate, {
    message: "End date cannot precede start date",
    path: ["endDate"],
  });
export type Booking = z.infer<typeof BookingSchema>;
export const BookingListSchema = z.array(BookingSchema);
export type BookingList = z.infer<typeof BookingListSchema>;

// Immutable, server-computed receipt; labels survive later catalog changes.
export const BookingDetailSchema = BookingSchema.safeExtend({
  extras: BookingExtrasSchema,
  totalCents: z.number().int().nonnegative(),
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  totalLabel: z.string(),
  quote: QuoteSchema,
  vehicleTitle: z.string(),
  pickupLocationName: z.string(),
  pickupAddress: z.string(),
});
export type BookingDetail = z.infer<typeof BookingDetailSchema>;

export const CheckoutSchema = z.object({
  vehicleId: z.string().min(1),
  requestKey: z.uuid(),
  // A consent check only: this value is never used to price the booking.
  expectedTotalCents: z.number().int().nonnegative(),
  extras: BookingExtrasSchema,
});
export type Checkout = z.infer<typeof CheckoutSchema>;

export const BookingCreationResponseSchema = z.object({
  booking: BookingDetailSchema,
  nextJourney: z.null(),
  alternatives: z.array(z.never()),
});
export type BookingCreationResponse = z.infer<
  typeof BookingCreationResponseSchema
>;
