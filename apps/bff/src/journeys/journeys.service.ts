import { Injectable } from '@nestjs/common';
import {
  IdentityVerificationWorkflowSchema,
  PreCheckInWorkflowSchema,
  ResolveJourneyResponseSchema,
  type IdentityVerificationStatus,
  type IdentityVerificationWorkflow,
  type JourneyTarget,
  type JourneyType,
  type PreCheckInWorkflow,
  type ResolveJourneyRequest,
  type ResolveJourneyResponse,
  type SubmitPreCheckInWorkflow,
} from '@handoff/contracts';
import { JourneyContentAdapter } from './content/journey-content.adapter';

@Injectable()
export class JourneysService {
  private readonly preCheckInWorkflows = new Map<string, PreCheckInWorkflow>();
  private readonly identityWorkflows = new Map<
    string,
    IdentityVerificationWorkflow
  >();

  constructor(private readonly contentAdapter: JourneyContentAdapter) {}

  resolve(input: ResolveJourneyRequest): ResolveJourneyResponse {
    const config = this.contentAdapter.getJourneyConfig();
    const journeyType = this.selectJourneyType(input, config.defaultJourney);
    const nextJourney = config.journeys[journeyType];
    const alternatives = this.getAlternatives(nextJourney.type);

    return ResolveJourneyResponseSchema.parse({
      bookingId: input.bookingId,
      nextJourney,
      alternatives,
    });
  }

  getPreCheckIn(reservationId: string): PreCheckInWorkflow {
    const existing = this.preCheckInWorkflows.get(reservationId);

    if (existing) {
      return existing;
    }

    return PreCheckInWorkflowSchema.parse({
      type: 'pre-check-in',
      reservationId,
      status: 'not_started',
      driver: {
        fullName: 'Primary driver',
        email: 'driver@example.com',
        phone: '555-0100',
      },
      pickup: {
        locationName: 'Downtown branch',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
      },
      trip: {},
    });
  }

  submitPreCheckIn(input: SubmitPreCheckInWorkflow): PreCheckInWorkflow {
    const workflow = PreCheckInWorkflowSchema.parse({
      type: 'pre-check-in',
      reservationId: input.reservationId,
      status: 'completed',
      driver: input.driver,
      pickup: input.pickup,
      trip: input.trip,
      completedAt: new Date().toISOString(),
    });

    this.preCheckInWorkflows.set(input.reservationId, workflow);

    return workflow;
  }

  getIdentityVerification(reservationId: string): IdentityVerificationWorkflow {
    const existing = this.identityWorkflows.get(reservationId);

    if (existing) {
      return existing;
    }

    return this.createIdentityWorkflow({
      reservationId,
      status: 'not_started',
      message:
        'Identity verification has not started. Start the provider handoff when the driver is ready.',
    });
  }

  startIdentityVerification(
    reservationId: string,
  ): IdentityVerificationWorkflow {
    const providerReference = `idv_mock_${reservationId}`;
    const workflow = this.createIdentityWorkflow({
      reservationId,
      status: 'handoff_created',
      providerReference,
      handoffUrl: `https://identity.local/handoff/${encodeURIComponent(providerReference)}`,
      message:
        'Provider handoff created. Continue to the provider-style check, then return to refresh status.',
    });

    this.identityWorkflows.set(reservationId, workflow);

    return workflow;
  }

  updateIdentityVerificationStatus(
    reservationId: string,
    status: Exclude<IdentityVerificationStatus, 'not_started'>,
  ): IdentityVerificationWorkflow {
    const current = this.getIdentityVerification(reservationId);
    const workflow = this.createIdentityWorkflow({
      reservationId,
      status,
      providerReference:
        current.providerReference ?? `idv_mock_${reservationId}`,
      handoffUrl: current.handoffUrl,
      message: getIdentityStatusMessage(status),
    });

    this.identityWorkflows.set(reservationId, workflow);

    return workflow;
  }

  private selectJourneyType(
    input: ResolveJourneyRequest,
    defaultJourney: JourneyType,
  ): JourneyType {
    if (input.bookingStatus !== 'pending' && input.signals.receiptAvailable) {
      return 'e-receipt';
    }

    if (input.signals.biometricEligible) {
      return 'biometric';
    }

    if (input.signals.upgradeAvailable) {
      return 'vehicle-upgrade';
    }

    if (input.signals.checkedInEligible) {
      return 'pre-check-in';
    }

    return defaultJourney;
  }

  private getAlternatives(selectedType: JourneyType): JourneyTarget[] {
    const config = this.contentAdapter.getJourneyConfig();

    return Object.values(config.journeys).filter(
      (journey) => journey.type !== selectedType,
    );
  }

  private createIdentityWorkflow(input: {
    reservationId: string;
    status: IdentityVerificationStatus;
    message: string;
    providerReference?: string;
    handoffUrl?: string;
  }): IdentityVerificationWorkflow {
    return IdentityVerificationWorkflowSchema.parse({
      type: 'biometric',
      reservationId: input.reservationId,
      status: input.status,
      provider: 'mock-identity-provider',
      providerReference: input.providerReference,
      handoffUrl: input.handoffUrl,
      message: input.message,
      updatedAt: new Date().toISOString(),
    });
  }
}

function getIdentityStatusMessage(
  status: Exclude<IdentityVerificationStatus, 'not_started'>,
): string {
  if (status === 'handoff_created') {
    return 'Provider handoff is ready for the driver.';
  }

  if (status === 'pending_review') {
    return 'Identity evidence was submitted and is pending provider review.';
  }

  if (status === 'verified') {
    return 'Identity verification is complete for this reservation.';
  }

  return 'Identity verification failed. The driver should retry or complete manual review at pickup.';
}
