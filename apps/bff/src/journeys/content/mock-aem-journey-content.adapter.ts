import { Injectable } from '@nestjs/common';
import { type AemJourneyConfig } from '@handoff/contracts';
import { JourneyContentAdapter } from './journey-content.adapter';
import { mockAemJourneyConfig } from './mock-aem-journey.config';

@Injectable()
export class MockAemJourneyContentAdapter extends JourneyContentAdapter {
  getJourneyConfig(): AemJourneyConfig {
    return mockAemJourneyConfig;
  }
}
