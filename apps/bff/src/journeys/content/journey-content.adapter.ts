import { type AemJourneyConfig } from '@handoff/contracts';

export abstract class JourneyContentAdapter {
  abstract getJourneyConfig(): AemJourneyConfig;
}
