import { Injectable } from '@nestjs/common';
import {
  PreCheckInWorkflowSchema,
  ResolveJourneyResponseSchema,
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
}
