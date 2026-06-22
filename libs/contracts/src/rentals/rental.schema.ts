import { z } from 'zod';

export const RentalStatusSchema = z.enum([
  'not-started',
  'active',
  'completed',
]);
export type RentalStatus = z.infer<typeof RentalStatusSchema>;

export const RentalSupportActionSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1).startsWith('/'),
  variant: z.enum(['contained', 'outlined', 'text']).default('outlined'),
});
export type RentalSupportAction = z.infer<typeof RentalSupportActionSchema>;

export const CurrentRentalSchema = z.object({
  rentalId: z.string().min(1),
  reservationId: z.string().min(1),
  vehicleId: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  status: RentalStatusSchema,
  reservationStatus: z.enum(['pending', 'confirmed', 'cancelled']),
  paymentState: z.enum(['not_started', 'authorized', 'paid', 'refunded', 'failed']),
  vehicleLabel: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  pickupLocation: z.string().min(1),
  returnLocation: z.string().min(1),
  supportActions: z.array(RentalSupportActionSchema).min(1),
  updatedAt: z.iso.datetime(),
});
export type CurrentRental = z.infer<typeof CurrentRentalSchema>;
