import { type AemJourneyPageConfig } from '@handoff/contracts';

export abstract class AemJourneyPageContentAdapter {
  abstract getJourneyPageConfig(): AemJourneyPageConfig;
}
