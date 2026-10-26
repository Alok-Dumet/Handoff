import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Header,
} from '@nestjs/common';
import {
  type Booking,
  type BookingCreationResponse,
  CheckoutSchema,
} from '@handoff/contracts';
import { BookingsService } from './bookings.service';
import { SessionGuard, type AuthenticatedRequest } from '../auth/session.guard';
import { SameOriginGuard } from '../auth/same-origin.guard';

@Controller('bookings')
@UseGuards(SessionGuard, SameOriginGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  findAll(@Req() request: AuthenticatedRequest): Promise<Booking[]> {
    return this.bookingsService.findAll(request.user.id);
  }

  @Post()
  @Header('Cache-Control', 'no-store')
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ): Promise<BookingCreationResponse> {
    const result = CheckoutSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return {
      booking: await this.bookingsService.create(result.data, request.user),
      nextJourney: null,
      alternatives: [],
    };
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  findOne(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Booking> {
    return this.bookingsService.findOne(id, request.user.id);
  }
}
