import { Controller, Get, Param } from '@nestjs/common';
import {
  type AemJourneyPageContent,
  type AemPageContent,
} from '@handoff/contracts';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('pages/:brandKey')
  getPageContent(@Param('brandKey') brandKey: string): AemPageContent {
    return this.contentService.getPageContent(brandKey);
  }

  @Get('journeys/:journeyKey')
  getJourneyPageContent(
    @Param('journeyKey') journeyKey: string,
  ): AemJourneyPageContent {
    return this.contentService.getJourneyPageContent(journeyKey);
  }
}
