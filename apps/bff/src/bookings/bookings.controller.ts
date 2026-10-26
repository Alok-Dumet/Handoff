import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  type Booking,
  type BookingCreationResponse,
  CreateBookingSchema,
} from '@handoff/contracts';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
  }

  @Post()
  async create(@Body() body: unknown): Promise<BookingCreationResponse> {
    const result = CreateBookingSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues);
    }

    return {
      booking: await this.bookingsService.create(result.data),
      nextJourney: null,
      alternatives: [],
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Booking> {
    return this.bookingsService.findOne(id);
  }
}
