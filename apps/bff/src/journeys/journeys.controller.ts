import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  PreCheckInWorkflowSchema,
  ResolveJourneyRequestSchema,
  SubmitPreCheckInWorkflowSchema,
  type PreCheckInWorkflow,
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

  @Get('pre-check-in/:reservationId')
  getPreCheckIn(
    @Param('reservationId') reservationId: string,
  ): PreCheckInWorkflow {
    return this.journeysService.getPreCheckIn(reservationId);
  }

  @Post('pre-check-in')
  submitPreCheckIn(@Body() body: unknown): PreCheckInWorkflow {
    const result = SubmitPreCheckInWorkflowSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return PreCheckInWorkflowSchema.parse(
      this.journeysService.submitPreCheckIn(result.data),
    );
  }
}
