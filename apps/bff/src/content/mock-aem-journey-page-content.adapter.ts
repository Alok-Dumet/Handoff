import { Injectable } from '@nestjs/common';
import { type AemJourneyPageConfig } from '@handoff/contracts';
import { AemJourneyPageContentAdapter } from './aem-journey-page-content.adapter';
import { mockAemJourneyPageConfig } from './mock-aem-journey-page.config';

@Injectable()
export class MockAemJourneyPageContentAdapter extends AemJourneyPageContentAdapter {
  getJourneyPageConfig(): AemJourneyPageConfig {
    return mockAemJourneyPageConfig;
  }
}
