import { Injectable } from '@nestjs/common';
import {
  ResolveJourneyResponseSchema,
  type JourneyTarget,
  type JourneyType,
  type ResolveJourneyRequest,
  type ResolveJourneyResponse,
} from '@handoff/contracts';
import { JourneyContentAdapter } from './content/journey-content.adapter';

@Injectable()
export class JourneysService {
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
