import { Module } from '@nestjs/common';
import { JourneyContentAdapter } from './content/journey-content.adapter';
import { MockAemJourneyContentAdapter } from './content/mock-aem-journey-content.adapter';
import { JourneysController } from './journeys.controller';
import { JourneysService } from './journeys.service';

@Module({
  controllers: [JourneysController],
  providers: [
    JourneysService,
    {
      provide: JourneyContentAdapter,
      useClass: MockAemJourneyContentAdapter,
    },
  ],
  exports: [JourneyContentAdapter, JourneysService],
})
export class JourneysModule {}
