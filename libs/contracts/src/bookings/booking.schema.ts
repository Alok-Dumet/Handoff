import { z } from 'zod';

export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

const BookingFieldsSchema = z.object({
  vehicleId: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.email(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

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
