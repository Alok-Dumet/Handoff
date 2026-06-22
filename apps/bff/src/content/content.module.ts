import { Module } from '@nestjs/common';
import { AemJourneyPageContentAdapter } from './aem-journey-page-content.adapter';
import { AemPageContentAdapter } from './aem-page-content.adapter';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { MockAemJourneyPageContentAdapter } from './mock-aem-journey-page-content.adapter';
import { MockAemPageContentAdapter } from './mock-aem-page-content.adapter';

@Module({
  controllers: [ContentController],
  providers: [
    ContentService,
    {
      provide: AemPageContentAdapter,
      useClass: MockAemPageContentAdapter,
    },
    {
      provide: AemJourneyPageContentAdapter,
      useClass: MockAemJourneyPageContentAdapter,
    },
  ],
  exports: [
    AemPageContentAdapter,
    AemJourneyPageContentAdapter,
    ContentService,
  ],
})
export class ContentModule {}
