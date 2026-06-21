import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  ResolveJourneyRequestSchema,
  type ResolveJourneyResponse,
} from '@handoff/contracts';
import { JourneysService } from './journeys.service';

@Controller('journeys')
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  @Post('resolve')
  resolve(@Body() body: unknown): ResolveJourneyResponse {
    const result = ResolveJourneyRequestSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return this.journeysService.resolve(result.data);
  }
}
