import { z } from 'zod';
import { BookingSchema, BookingStatusSchema } from '../bookings/index.js';

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

export const BookingJourneyResponseSchema = z.object({
  booking: BookingSchema,
  nextJourney: JourneyTargetSchema,
  alternatives: z.array(JourneyTargetSchema).default([]),
});
export type BookingJourneyResponse = z.infer<
  typeof BookingJourneyResponseSchema
>;

export const JourneyWorkflowStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
]);
export type JourneyWorkflowStatus = z.infer<
  typeof JourneyWorkflowStatusSchema
>;

export const PreCheckInWorkflowSchema = z.object({
  type: z.literal('pre-check-in'),
  reservationId: z.string().min(1),
  status: JourneyWorkflowStatusSchema,
  driver: z.object({
    fullName: z.string().min(1),
    email: z.email(),
    phone: z.string().min(7),
  }),
  pickup: z.object({
    locationName: z.string().min(1),
    date: z.iso.date(),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }),
  trip: z.object({
    flightNumber: z.string().min(2).optional(),
    notes: z.string().max(500).optional(),
  }),
  completedAt: z.iso.datetime().optional(),
});
export type PreCheckInWorkflow = z.infer<typeof PreCheckInWorkflowSchema>;

export const SubmitPreCheckInWorkflowSchema = z.object({
  reservationId: z.string().min(1),
  driver: PreCheckInWorkflowSchema.shape.driver,
  pickup: PreCheckInWorkflowSchema.shape.pickup,
  trip: PreCheckInWorkflowSchema.shape.trip,
});
export type SubmitPreCheckInWorkflow = z.infer<
  typeof SubmitPreCheckInWorkflowSchema
>;

export const IdentityVerificationStatusSchema = z.enum([
  'not_started',
  'handoff_created',
  'pending_review',
  'verified',
  'failed',
]);
export type IdentityVerificationStatus = z.infer<
  typeof IdentityVerificationStatusSchema
>;

export const IdentityVerificationWorkflowSchema = z.object({
  type: z.literal('biometric'),
  reservationId: z.string().min(1),
  status: IdentityVerificationStatusSchema,
  provider: z.literal('mock-identity-provider'),
  providerReference: z.string().min(1).optional(),
  handoffUrl: z.string().url().optional(),
  message: z.string().min(1),
  updatedAt: z.iso.datetime(),
});
export type IdentityVerificationWorkflow = z.infer<
  typeof IdentityVerificationWorkflowSchema
>;

export const StartIdentityVerificationWorkflowSchema = z.object({
  reservationId: z.string().min(1),
});
export type StartIdentityVerificationWorkflow = z.infer<
  typeof StartIdentityVerificationWorkflowSchema
>;

export const UpdateIdentityVerificationStatusSchema = z.object({
  reservationId: z.string().min(1),
  status: IdentityVerificationStatusSchema.exclude(['not_started']),
});
export type UpdateIdentityVerificationStatus = z.infer<
  typeof UpdateIdentityVerificationStatusSchema
>;
