import { Injectable } from '@nestjs/common';
import {
  AemBrandKeySchema,
  AemJourneyPageContentSchema,
  AemPageContentSchema,
  JourneyTypeSchema,
  type AemPageContent,
  type AemJourneyPageContent,
} from '@handoff/contracts';
import { AemJourneyPageContentAdapter } from './aem-journey-page-content.adapter';
import { AemPageContentAdapter } from './aem-page-content.adapter';

@Injectable()
export class ContentService {
  constructor(
    private readonly pageContentAdapter: AemPageContentAdapter,
    private readonly journeyPageContentAdapter: AemJourneyPageContentAdapter,
  ) {}

  getPageContent(brandKey: string): AemPageContent {
    const config = this.pageContentAdapter.getPageConfig();
    const parsedBrandKey = AemBrandKeySchema.safeParse(brandKey);
    const selectedBrandKey = parsedBrandKey.success
      ? parsedBrandKey.data
      : 'handoff';

    return AemPageContentSchema.parse(config.pages[selectedBrandKey]);
  }

  getJourneyPageContent(journeyKey: string): AemJourneyPageContent {
    const config = this.journeyPageContentAdapter.getJourneyPageConfig();
    const parsedJourneyKey = JourneyTypeSchema.safeParse(journeyKey);
    const selectedJourneyKey = parsedJourneyKey.success
      ? parsedJourneyKey.data
      : 'pre-check-in';

    return AemJourneyPageContentSchema.parse(config.pages[selectedJourneyKey]);
  }
}
