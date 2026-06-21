import { Injectable } from '@nestjs/common';
import { type AemPageConfig } from '@handoff/contracts';
import { AemPageContentAdapter } from './aem-page-content.adapter';
import { mockAemPageConfig } from '../journeys/content/mock-aem-page.config';

@Injectable()
export class MockAemPageContentAdapter extends AemPageContentAdapter {
  getPageConfig(): AemPageConfig {
    return mockAemPageConfig;
  }
}
