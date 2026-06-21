import { z } from 'zod';
import { BookingStatusSchema } from '../bookings/index.js';

export const JourneyTypeSchema = z.enum([
  'pre-check-in',
  'biometric',
  'e-receipt',
  'vehicle-upgrade',
]);
export type JourneyType = z.infer<typeof JourneyTypeSchema>;

export const JourneyTargetSchema = z.object({
  type: JourneyTypeSchema,
  label: z.string().min(1),
  path: z.string().min(1).startsWith('/'),
  ctaLabel: z.string().min(1),
  description: z.string().min(1).optional(),
});
export type JourneyTarget = z.infer<typeof JourneyTargetSchema>;

export const AemJourneyConfigSchema = z.object({
  source: z.literal('mock-aem'),
  version: z.string().min(1),
  defaultJourney: JourneyTypeSchema,
  journeys: z.record(JourneyTypeSchema, JourneyTargetSchema),
});
export type AemJourneyConfig = z.infer<typeof AemJourneyConfigSchema>;

export const ResolveJourneyRequestSchema = z.object({
  bookingId: z.string().min(1),
  vehicleId: z.string().min(1),
  customerEmail: z.email(),
  bookingStatus: BookingStatusSchema,
  signals: z
    .object({
      checkedInEligible: z.boolean().default(false),
      biometricEligible: z.boolean().default(false),
      receiptAvailable: z.boolean().default(false),
      upgradeAvailable: z.boolean().default(false),
    })
    .default({
      checkedInEligible: false,
      biometricEligible: false,
      receiptAvailable: false,
      upgradeAvailable: false,
    }),
});
export type ResolveJourneyRequest = z.infer<
  typeof ResolveJourneyRequestSchema
>;

export const ResolveJourneyResponseSchema = z.object({
  bookingId: z.string().min(1),
  nextJourney: JourneyTargetSchema,
  alternatives: z.array(JourneyTargetSchema).default([]),
});
export type ResolveJourneyResponse = z.infer<
  typeof ResolveJourneyResponseSchema
>;
