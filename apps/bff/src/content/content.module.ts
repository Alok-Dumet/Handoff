import { Module } from '@nestjs/common';
import { AemPageContentAdapter } from './aem-page-content.adapter';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { MockAemPageContentAdapter } from './mock-aem-page-content.adapter';

@Module({
  controllers: [ContentController],
  providers: [
    ContentService,
    {
      provide: AemPageContentAdapter,
      useClass: MockAemPageContentAdapter,
    },
  ],
  exports: [AemPageContentAdapter, ContentService],
})
export class ContentModule {}
