import { z } from 'zod';
import { BookingSchema, BookingStatusSchema } from '../bookings/index.js';
import { TransmissionSchema, VehicleClassSchema } from '../vehicles/index.js';

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

export const ReceiptDeliveryPreferenceSchema = z.enum(['email', 'download']);
export type ReceiptDeliveryPreference = z.infer<
  typeof ReceiptDeliveryPreferenceSchema
>;

export const ReceiptLineItemSchema = z.object({
  label: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
});
export type ReceiptLineItem = z.infer<typeof ReceiptLineItemSchema>;

export const EReceiptWorkflowStatusSchema = z.enum([
  'not_started',
  'ready',
  'sent',
]);
export type EReceiptWorkflowStatus = z.infer<
  typeof EReceiptWorkflowStatusSchema
>;

export const EReceiptWorkflowSchema = z.object({
  type: z.literal('e-receipt'),
  reservationId: z.string().min(1),
  status: EReceiptWorkflowStatusSchema,
  deliveryPreference: ReceiptDeliveryPreferenceSchema,
  deliveryEmail: z.email(),
  receiptNumber: z.string().min(1),
  lineItems: z.array(ReceiptLineItemSchema).min(1),
  subtotalCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  totalCents: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
  sentAt: z.iso.datetime().optional(),
  message: z.string().min(1),
});
export type EReceiptWorkflow = z.infer<typeof EReceiptWorkflowSchema>;

export const UpdateEReceiptDeliveryPreferenceSchema = z.object({
  reservationId: z.string().min(1),
  deliveryPreference: ReceiptDeliveryPreferenceSchema,
});
export type UpdateEReceiptDeliveryPreference = z.infer<
  typeof UpdateEReceiptDeliveryPreferenceSchema
>;

export const VehicleUpgradeOfferSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().min(1),
  class: VehicleClassSchema,
  transmission: TransmissionSchema,
  seats: z.number().int().positive(),
  pricePerDay: z.number().nonnegative(),
  priceLabel: z.string().min(1),
  deltaPerDayCents: z.number().int(),
  deltaLabel: z.string().min(1),
});
export type VehicleUpgradeOffer = z.infer<typeof VehicleUpgradeOfferSchema>;

export const VehicleUpgradeWorkflowStatusSchema = z.enum([
  'not_started',
  'reviewing',
  'confirmed',
]);
export type VehicleUpgradeWorkflowStatus = z.infer<
  typeof VehicleUpgradeWorkflowStatusSchema
>;

export const VehicleUpgradeWorkflowSchema = z.object({
  type: z.literal('vehicle-upgrade'),
  reservationId: z.string().min(1),
  status: VehicleUpgradeWorkflowStatusSchema,
  currentVehicle: VehicleUpgradeOfferSchema,
  offers: z.array(VehicleUpgradeOfferSchema).min(1),
  selectedVehicleId: z.string().min(1).optional(),
  selectedOffer: VehicleUpgradeOfferSchema.optional(),
  updatedAt: z.iso.datetime(),
  confirmedAt: z.iso.datetime().optional(),
  message: z.string().min(1),
});
export type VehicleUpgradeWorkflow = z.infer<
  typeof VehicleUpgradeWorkflowSchema
>;

export const StartVehicleUpgradeWorkflowSchema = z.object({
  reservationId: z.string().min(1),
});
export type StartVehicleUpgradeWorkflow = z.infer<
  typeof StartVehicleUpgradeWorkflowSchema
>;

export const SelectVehicleUpgradeWorkflowSchema = z.object({
  reservationId: z.string().min(1),
  vehicleId: z.string().min(1),
});
export type SelectVehicleUpgradeWorkflow = z.infer<
  typeof SelectVehicleUpgradeWorkflowSchema
>;

export const ConfirmVehicleUpgradeWorkflowSchema = z.object({
  reservationId: z.string().min(1),
});
export type ConfirmVehicleUpgradeWorkflow = z.infer<
  typeof ConfirmVehicleUpgradeWorkflowSchema
>;
