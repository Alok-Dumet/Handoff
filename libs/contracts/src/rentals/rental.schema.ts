import { z } from 'zod';

export const RentalStatusSchema = z.enum([
  'not-started',
  'active',
  'completed',
]);
export type RentalStatus = z.infer<typeof RentalStatusSchema>;

export const CurrentRentalSchema = z.object({
  rentalId: z.string().min(1),
  reservationId: z.string().min(1),
  vehicleId: z.string().min(1),
  customerId: z.string().min(1),
  status: RentalStatusSchema,
  pickupLocation: z.string().min(1),
  returnLocation: z.string().min(1),
});
export type CurrentRental = z.infer<typeof CurrentRentalSchema>;
