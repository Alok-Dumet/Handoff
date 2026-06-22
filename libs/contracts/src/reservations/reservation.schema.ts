import { z } from 'zod';
import { BookingStatusSchema } from '../bookings/booking.schema.js';
import { JourneyTargetSchema } from '../journeys/journey.schema.js';

export const ReservationCapabilitySchema = z.object({
  name: z.string().min(1),
  method: z.enum(['GET', 'POST']),
  href: z.string().min(1).startsWith('/'),
});
export type ReservationCapability = z.infer<
  typeof ReservationCapabilitySchema
>;

export const ReservationSummarySchema = z.object({
  domain: z.literal('reservation'),
  description: z.string().min(1),
  capabilities: z.array(ReservationCapabilitySchema).min(1),
});
export type ReservationSummary = z.infer<typeof ReservationSummarySchema>;

export const ReservationPaymentStateSchema = z.enum([
  'not_started',
  'authorized',
  'paid',
  'refunded',
]);
export type ReservationPaymentState = z.infer<
  typeof ReservationPaymentStateSchema
>;

export const ReservationListItemSchema = z.object({
  id: z.string().min(1),
  vehicleId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  status: BookingStatusSchema,
  paymentState: ReservationPaymentStateSchema,
  detailHref: z.string().min(1).startsWith('/'),
  nextActionLabel: z.string().min(1),
  nextActionHref: z.string().min(1).startsWith('/'),
});
export type ReservationListItem = z.infer<
  typeof ReservationListItemSchema
>;

export const ReservationListSchema = z.array(ReservationListItemSchema);
export type ReservationList = z.infer<typeof ReservationListSchema>;

export const ReservationDetailSchema = ReservationListItemSchema.extend({
  createdAt: z.iso.datetime(),
  vehicleLabel: z.string().min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.email(),
  }),
  nextJourney: JourneyTargetSchema,
});
export type ReservationDetail = z.infer<typeof ReservationDetailSchema>;
